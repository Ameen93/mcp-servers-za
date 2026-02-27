import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SharePriceSource } from "./share-price-source.js";

export const sharePriceInputSchema = {
  ticker: z.string().min(1).describe("JSE ticker symbol e.g. NPN, SOL, AGL"),
};

/**
 * Register the get_share_price tool on the given MCP server.
 * The data source is injected so callers can swap mock / live implementations.
 */
export function registerGetSharePrice(server: McpServer, source: SharePriceSource): void {
  server.registerTool(
    "get_share_price",
    {
      title: "Get share price",
      description:
        "Get the latest share price, daily change, and volume for a JSE-listed share.",
      inputSchema: sharePriceInputSchema,
    },
    async ({ ticker }) => {
      try {
        const data = await source.getPrice(ticker);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  provider: "jse",
                  action: "get_share_price",
                  ...data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
        };
      }
    },
  );
}
