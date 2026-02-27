import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetSharePrice } from "./get-share-price.js";
import type { SharePrice, SharePriceSource } from "./share-price-source.js";

/** Helper: create a server with the tool registered, return an invocation helper. */
function setup(source: SharePriceSource) {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerGetSharePrice(server, source);
  return server;
}

/** Invoke the tool handler directly via the internal tool map. */
async function callTool(server: McpServer, ticker: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools = (server as any)._registeredTools as Record<string, any>;
  const entry = tools["get_share_price"];
  if (!entry) throw new Error("Tool not registered");
  const cb = entry.callback ?? entry.handler;
  return cb({ ticker }, {} as any);
}

// ── Valid ticker ──────────────────────────────────────────────────────────────

describe("get_share_price", () => {
  it("returns price data for a valid ticker", async () => {
    const mockPrice: SharePrice = {
      ticker: "NPN",
      price: 325080,
      change: 1250,
      changePercent: 0.39,
      volume: 1_542_300,
      currency: "ZAc",
      asOf: "2026-02-27T14:00:00.000Z",
    };
    const source: SharePriceSource = { getPrice: vi.fn().mockResolvedValue(mockPrice) };
    const server = setup(source);

    const result = await callTool(server, "NPN");
    const payload = JSON.parse(result.content[0].text);

    expect(payload.provider).toBe("jse");
    expect(payload.action).toBe("get_share_price");
    expect(payload.ticker).toBe("NPN");
    expect(payload.price).toBe(325080);
    expect(payload.change).toBe(1250);
    expect(payload.volume).toBe(1_542_300);
    expect(source.getPrice).toHaveBeenCalledWith("NPN");
  });

  // ── Unknown ticker ──────────────────────────────────────────────────────────

  it("returns an error for an unknown ticker", async () => {
    const source: SharePriceSource = {
      getPrice: vi.fn().mockRejectedValue(new Error("Unknown ticker: XYZ")),
    };
    const server = setup(source);

    const result = await callTool(server, "XYZ");

    expect(result.content[0].text).toContain("Error: Unknown ticker: XYZ");
  });

  // ── Source error ────────────────────────────────────────────────────────────

  it("returns an error when the data source fails", async () => {
    const source: SharePriceSource = {
      getPrice: vi.fn().mockRejectedValue(new Error("Network timeout")),
    };
    const server = setup(source);

    const result = await callTool(server, "NPN");

    expect(result.content[0].text).toContain("Error: Network timeout");
  });
});
