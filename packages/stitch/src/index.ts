#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { isoNow, optionalEnv, requiredEnv } from "@mcp-servers-za/shared";

const stitchApiKey = requiredEnv("STITCH_API_KEY");
const stitchBaseUrl = optionalEnv("STITCH_BASE_URL", "https://api.stitch.money");

const server = new McpServer({
  name: "stitch-payments",
  version: "0.1.0"
});

server.registerTool(
  "create_payment",
  {
    title: "Create payment",
    description: "Initiate a Stitch payment request (EFT/card depending on account config)",
    inputSchema: {
      amountZar: z.number().positive(),
      reference: z.string().min(1),
      payerId: z.string().min(1),
      currency: z.string().default("ZAR")
    }
  },
  async (input) => {
    const payload = {
      provider: "stitch",
      action: "create_payment",
      ...input,
      status: "queued",
      createdAt: isoNow(),
      note: "Stub response. Wire to Stitch API next."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "check_payment_status",
  {
    title: "Check payment status",
    description: "Lookup payment status by payment ID/reference",
    inputSchema: {
      paymentId: z.string().min(1)
    }
  },
  async ({ paymentId }) => {
    const payload = {
      provider: "stitch",
      action: "check_payment_status",
      paymentId,
      status: "pending",
      checkedAt: isoNow(),
      note: "Stub response. Replace with Stitch transaction lookup."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "create_vrp_mandate",
  {
    title: "Create VRP mandate",
    description: "Create a variable recurring payment mandate",
    inputSchema: {
      customerId: z.string().min(1),
      maxAmountZar: z.number().positive(),
      interval: z.enum(["daily", "weekly", "monthly"])
    }
  },
  async (input) => {
    const payload = {
      provider: "stitch",
      action: "create_vrp_mandate",
      ...input,
      mandateStatus: "created",
      createdAt: isoNow(),
      note: "Stub response. Connect to Stitch VRP API."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "list_transactions",
  {
    title: "List transactions",
    description: "List recent transactions with optional limit",
    inputSchema: {
      limit: z.number().int().positive().max(100).default(20)
    }
  },
  async ({ limit }) => {
    const tx = Array.from({ length: Math.min(limit, 3) }).map((_, i) => ({
      id: `tx_${i + 1}`,
      amountZar: 100 + i * 25,
      status: "settled",
      createdAt: isoNow()
    }));

    const payload = {
      provider: "stitch",
      action: "list_transactions",
      count: tx.length,
      transactions: tx,
      note: "Stub response. Replace with Stitch transactions query."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

server.registerTool(
  "initiate_refund",
  {
    title: "Initiate refund",
    description: "Create a refund for a settled payment",
    inputSchema: {
      paymentId: z.string().min(1),
      amountZar: z.number().positive(),
      reason: z.string().min(1)
    }
  },
  async (input) => {
    const payload = {
      provider: "stitch",
      action: "initiate_refund",
      ...input,
      refundStatus: "queued",
      createdAt: isoNow(),
      note: "Stub response. Connect to Stitch refund endpoint."
    };

    return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
  }
);

async function main() {
  // keep vars referenced to avoid dead-code stripping + assert config loaded
  void stitchApiKey;
  void stitchBaseUrl;

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("stitch-mcp fatal error", err);
  process.exit(1);
});
