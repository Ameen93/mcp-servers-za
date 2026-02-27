#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { isoNow, requiredEnv, AlphaVantageClient } from "@mcp-servers-za/shared";
import { registerGetSharePrice } from "./get-share-price.js";
import { MockSharePriceSource } from "./mock-share-price-source.js";

const avClient = new AlphaVantageClient({
  apiKey: requiredEnv("ALPHA_VANTAGE_API_KEY"),
});

const server = new McpServer({
  name: "jse-market-data",
  version: "0.1.0",
});

function errorResponse(err: unknown): { content: Array<{ type: "text"; text: string }> } {
  const message = err instanceof Error ? err.message : String(err);
  const hint =
    err instanceof Error && err.name === "AlphaVantageRateLimitError"
      ? "\n\nHint: Alpha Vantage free tier allows 5 requests/minute and 500/day. Please wait a moment and try again."
      : "";
  return {
    content: [{ type: "text", text: `Error: ${message}${hint}` }],
  };
}

// ── Get Share Price (configurable data source) ──────────────────────────────
registerGetSharePrice(server, new MockSharePriceSource());

// ── Get Quote ───────────────────────────────────────────────────────────────

server.registerTool(
  "get_quote",
  {
    title: "Get quote",
    description:
      "Get the latest quote for a JSE-listed instrument. Use the JSE ticker (e.g. NPN, SOL, AGL).",
    inputSchema: {
      ticker: z.string().min(1).describe("JSE ticker symbol e.g. NPN, SOL, AGL"),
    },
  },
  async ({ ticker }) => {
    try {
      const quote = await avClient.getQuote(ticker);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "jse",
                action: "get_quote",
                ticker: ticker.toUpperCase(),
                symbol: quote.symbol,
                priceZar: quote.price,
                openZar: quote.open,
                highZar: quote.high,
                lowZar: quote.low,
                volume: quote.volume,
                previousCloseZar: quote.previousClose,
                changeZar: quote.change,
                changePercent: quote.changePercent,
                latestTradingDay: quote.latestTradingDay,
                asOf: isoNow(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ── Get Historical ──────────────────────────────────────────────────────────

server.registerTool(
  "get_historical",
  {
    title: "Get historical prices",
    description: "Retrieve daily OHLCV history for a JSE ticker",
    inputSchema: {
      ticker: z.string().min(1),
      days: z.number().int().positive().max(3650).default(30),
      outputSize: z
        .enum(["compact", "full"])
        .default("compact")
        .describe("compact=100 days, full=20+ years"),
    },
  },
  async ({ ticker, days, outputSize }) => {
    try {
      const bars = await avClient.getHistorical(ticker, outputSize);
      const limited = bars.slice(0, days);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "jse",
                action: "get_historical",
                ticker: ticker.toUpperCase(),
                points: limited.length,
                currency: "ZAR",
                history: limited,
                asOf: isoNow(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ── Search Instruments ──────────────────────────────────────────────────────

server.registerTool(
  "search_instruments",
  {
    title: "Search instruments",
    description: "Search for JSE-listed instruments by name or ticker",
    inputSchema: {
      query: z.string().min(1),
    },
  },
  async ({ query }) => {
    try {
      const results = await avClient.searchInstruments(query);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "jse",
                action: "search_instruments",
                query,
                count: results.length,
                results,
                note:
                  results.length === 0
                    ? "No JSE instruments found. Try a broader search term, or note that Alpha Vantage may not cover all JSE-listed instruments."
                    : undefined,
                asOf: isoNow(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ── SENS Announcements ──────────────────────────────────────────────────────

server.registerTool(
  "get_sens_announcements",
  {
    title: "Get SENS announcements",
    description: "Get latest SENS (Stock Exchange News Service) announcements from the JSE",
    inputSchema: {
      ticker: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
    },
  },
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              provider: "jse",
              action: "get_sens_announcements",
              status: "not_available",
              message:
                "SENS announcements are not available through the free Alpha Vantage API. " +
                "To access SENS data, consider:\n" +
                "1. Visit https://www.sharenet.co.za/sens for free browsing\n" +
                "2. Use the JSE direct data feed (requires commercial license)\n" +
                "3. Use ProfileData or Infront as a premium data provider\n\n" +
                "This feature will be available in a future premium tier.",
              asOf: isoNow(),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("jse-mcp fatal error", err);
  process.exit(1);
});
