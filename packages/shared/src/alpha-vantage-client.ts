import { Cache } from "./cache.js";
import { RateLimiter } from "./rate-limiter.js";
import { fetchWithRetry } from "./fetch-utils.js";

export interface AlphaVantageConfig {
  apiKey: string;
  baseUrl?: string;
  cacheTtlMs?: number;
  maxCallsPerMinute?: number;
}

export interface Quote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: string;
}

export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export class AlphaVantageClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: Cache;
  private rateLimiter: RateLimiter;

  constructor(config: AlphaVantageConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://www.alphavantage.co/query";
    this.cache = new Cache(config.cacheTtlMs ?? 60_000);
    this.rateLimiter = new RateLimiter(
      config.maxCallsPerMinute ?? 5,
      60_000
    );
  }

  private async request(params: Record<string, string>): Promise<unknown> {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get<unknown>(cacheKey);
    if (cached !== undefined) return cached;

    await this.rateLimiter.acquire();

    const url = new URL(this.baseUrl);
    url.searchParams.set("apikey", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const response = await fetchWithRetry(url.toString(), {}, { maxRetries: 2 });

    if (!response.ok) {
      throw new AlphaVantageError(
        `API request failed (${response.status}): ${await response.text()}`
      );
    }

    const data = await response.json();

    // Alpha Vantage returns errors in the response body
    if (data["Error Message"]) {
      throw new AlphaVantageError(data["Error Message"]);
    }
    if (data["Note"]) {
      throw new AlphaVantageRateLimitError(data["Note"]);
    }
    if (data["Information"]) {
      throw new AlphaVantageRateLimitError(data["Information"]);
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  private jseSymbol(ticker: string): string {
    const t = ticker.toUpperCase();
    return t.endsWith(".JNB") ? t : `${t}.JNB`;
  }

  async getQuote(ticker: string): Promise<Quote> {
    const symbol = this.jseSymbol(ticker);
    const data = (await this.request({
      function: "GLOBAL_QUOTE",
      symbol,
    })) as Record<string, Record<string, string>>;

    const q = data["Global Quote"];
    if (!q || !q["05. price"]) {
      throw new AlphaVantageError(`No quote data found for ${symbol}`);
    }

    return {
      symbol: q["01. symbol"] ?? symbol,
      open: parseFloat(q["02. open"] ?? "0"),
      high: parseFloat(q["03. high"] ?? "0"),
      low: parseFloat(q["04. low"] ?? "0"),
      price: parseFloat(q["05. price"] ?? "0"),
      volume: parseInt(q["06. volume"] ?? "0", 10),
      latestTradingDay: q["07. latest trading day"] ?? "",
      previousClose: parseFloat(q["08. previous close"] ?? "0"),
      change: parseFloat(q["09. change"] ?? "0"),
      changePercent: q["10. change percent"] ?? "0%",
    };
  }

  async getHistorical(
    ticker: string,
    outputSize: "compact" | "full" = "compact"
  ): Promise<DailyBar[]> {
    const symbol = this.jseSymbol(ticker);
    const data = (await this.request({
      function: "TIME_SERIES_DAILY",
      symbol,
      outputsize: outputSize,
    })) as Record<string, Record<string, Record<string, string>>>;

    const series = data["Time Series (Daily)"];
    if (!series) {
      throw new AlphaVantageError(`No historical data found for ${symbol}`);
    }

    return Object.entries(series).map(([date, bar]) => ({
      date,
      open: parseFloat(bar["1. open"] ?? "0"),
      high: parseFloat(bar["2. high"] ?? "0"),
      low: parseFloat(bar["3. low"] ?? "0"),
      close: parseFloat(bar["4. close"] ?? "0"),
      volume: parseInt(bar["5. volume"] ?? "0", 10),
    }));
  }

  async searchInstruments(query: string): Promise<SearchResult[]> {
    const data = (await this.request({
      function: "SYMBOL_SEARCH",
      keywords: query,
    })) as { bestMatches?: Array<Record<string, string>> };

    const matches = data.bestMatches ?? [];

    // Filter to JSE results (.JNB suffix or Johannesburg region)
    return matches
      .filter(
        (m) =>
          m["4. region"]?.includes("Johannesburg") ||
          m["1. symbol"]?.endsWith(".JNB")
      )
      .map((m) => ({
        symbol: m["1. symbol"] ?? "",
        name: m["2. name"] ?? "",
        type: m["3. type"] ?? "",
        region: m["4. region"] ?? "",
        currency: m["8. currency"] ?? "ZAR",
      }));
  }
}

export class AlphaVantageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlphaVantageError";
  }
}

export class AlphaVantageRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlphaVantageRateLimitError";
  }
}
