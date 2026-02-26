#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { isoNow, optionalEnv, requiredEnv } from "@mcp-servers-za/shared";

const jseApiKey = requiredEnv("JSE_API_KEY");
const jseBaseUrl = optionalEnv("JSE_BASE_URL", "https://example-jse-provider.local");

const server = new McpServer({
  name: "jse-market-data",
  version: "0.1.0"
});

server.registerTool(
  "get_quote",
  {
    title: "Get quote",
    description: "Get latest quote for a JSE instrument ticker",
    inputSchema: {
      ticker: z.string().min(1)
    }
  },
  async ({ ticker }) => {
    const payload = {
      provider: "jse",
      action: "get_quote",
      ticker: ticker.toUpperCase(),
      priceZar: 123.45,
      changePct: 0.82,
      asOf: isoNow(),
      note: "Stub response. Hook into chosen JSE data provider."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "get_historical",
  {
    title: "Get historical prices",
    description: "Retrieve OHLCV history for a ticker",
    inputSchema: {
      ticker: z.string().min(1),
      days: z.number().int().positive().max(3650).default(30)
    }
  },
  async ({ ticker, days }) => {
    const history = Array.from({ length: Math.min(days, 5) }).map((_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      open: 120 + i,
      high: 123 + i,
      low: 119 + i,
      close: 122 + i,
      volume: 100000 + i * 1000
    }));

    const payload = {
      provider: "jse",
      action: "get_historical",
      ticker: ticker.toUpperCase(),
      points: history.length,
      history,
      note: "Stub response. Replace with live historical feed."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "search_instruments",
  {
    title: "Search instruments",
    description: "Search JSE instruments by name/ticker text",
    inputSchema: {
      query: z.string().min(1)
    }
  },
  async ({ query }) => {
    const payload = {
      provider: "jse",
      action: "search_instruments",
      query,
      results: [
        { ticker: "NPN", name: "Naspers Ltd", type: "equity" },
        { ticker: "AGL", name: "Anglo American plc", type: "equity" }
      ].filter((x) => `${x.ticker} ${x.name}`.toLowerCase().includes(query.toLowerCase())),
      note: "Stub response. Replace with provider search endpoint."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "get_sens_announcements",
  {
    title: "Get SENS announcements",
    description: "Fetch latest SENS announcements",
    inputSchema: {
      ticker: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10)
    }
  },
  async ({ ticker, limit }) => {
    const base = [
      { id: "sens_1", ticker: "NPN", headline: "Trading statement", publishedAt: isoNow() },
      { id: "sens_2", ticker: "SBK", headline: "Results announcement", publishedAt: isoNow() }
    ];

    const items = base
      .filter((x) => (ticker ? x.ticker === ticker.toUpperCase() : true))
      .slice(0, limit);

    const payload = {
      provider: "jse",
      action: "get_sens_announcements",
      count: items.length,
      announcements: items,
      note: "Stub response. Replace with SENS feed integration."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

async function main() {
  void jseApiKey;
  void jseBaseUrl;

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("jse-mcp fatal error", err);
  process.exit(1);
});
