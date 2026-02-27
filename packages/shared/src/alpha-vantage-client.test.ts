import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AlphaVantageClient,
  AlphaVantageError,
  AlphaVantageRateLimitError,
} from "./alpha-vantage-client.js";

const mockFetch = vi.fn();

describe("AlphaVantageClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeClient() {
    return new AlphaVantageClient({
      apiKey: "test-key",
      maxCallsPerMinute: 100, // high limit for tests
    });
  }

  it("getQuote returns parsed quote", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          "Global Quote": {
            "01. symbol": "NPN.JNB",
            "02. open": "3200.00",
            "03. high": "3250.00",
            "04. low": "3180.00",
            "05. price": "3220.50",
            "06. volume": "1500000",
            "07. latest trading day": "2026-02-26",
            "08. previous close": "3190.00",
            "09. change": "30.50",
            "10. change percent": "0.9561%",
          },
        }),
        { status: 200 }
      )
    );

    const quote = await client.getQuote("NPN");
    expect(quote.symbol).toBe("NPN.JNB");
    expect(quote.price).toBe(3220.5);
    expect(quote.volume).toBe(1500000);
  });

  it("getQuote appends .JNB suffix", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          "Global Quote": {
            "05. price": "100.00",
          },
        }),
        { status: 200 }
      )
    );

    await client.getQuote("SOL");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("SOL.JNB");
  });

  it("throws on empty quote data", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ "Global Quote": {} }), { status: 200 })
    );

    await expect(client.getQuote("FAKE")).rejects.toThrow(AlphaVantageError);
  });

  it("throws on rate limit note", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ Note: "Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute." }),
        { status: 200 }
      )
    );

    await expect(client.getQuote("NPN")).rejects.toThrow(AlphaVantageRateLimitError);
  });

  it("getHistorical returns bars", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          "Time Series (Daily)": {
            "2026-02-26": {
              "1. open": "100",
              "2. high": "105",
              "3. low": "99",
              "4. close": "103",
              "5. volume": "50000",
            },
          },
        }),
        { status: 200 }
      )
    );

    const bars = await client.getHistorical("NPN");
    expect(bars).toHaveLength(1);
    expect(bars[0].close).toBe(103);
  });

  it("searchInstruments filters to JSE", async () => {
    const client = makeClient();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          bestMatches: [
            {
              "1. symbol": "NPN.JNB",
              "2. name": "Naspers Ltd",
              "3. type": "Equity",
              "4. region": "Johannesburg",
              "8. currency": "ZAR",
            },
            {
              "1. symbol": "NPSNY",
              "2. name": "Naspers ADR",
              "3. type": "Equity",
              "4. region": "United States",
              "8. currency": "USD",
            },
          ],
        }),
        { status: 200 }
      )
    );

    const results = await client.searchInstruments("naspers");
    expect(results).toHaveLength(1);
    expect(results[0].symbol).toBe("NPN.JNB");
  });
});
