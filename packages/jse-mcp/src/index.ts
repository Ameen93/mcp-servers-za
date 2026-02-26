import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "@mcp-servers-za/jse",
  version: "0.1.0",
});

// TODO: Implement tools
// - get_quote
// - get_historical
// - search_instruments
// - get_sens_announcements

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("JSE Market Data MCP server running on stdio");
}

main().catch(console.error);
