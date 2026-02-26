import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "@mcp-servers-za/stitch",
  version: "0.1.0",
});

// TODO: Implement tools
// - create_payment
// - check_payment_status
// - create_vrp_mandate
// - list_transactions
// - initiate_refund

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stitch MCP server running on stdio");
}

main().catch(console.error);
