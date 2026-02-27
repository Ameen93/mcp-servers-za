/**
 * Integration tests for Stitch MCP server tools.
 *
 * Mock HTTP responses (OAuth token + GraphQL) at the fetch level and exercise
 * the full tool handler flow via MCP Client ↔ Server in-memory transport.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { StitchClient } from "./lib/stitch-client.js";
import { isoNow } from "./lib/env.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

beforeAll(() => { globalThis.fetch = mockFetch as unknown as typeof fetch; });
afterAll(() => { globalThis.fetch = originalFetch; });
beforeEach(() => { mockFetch.mockReset(); });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Queue a successful token response followed by a GraphQL data response. */
function mockTokenThenGraphQL(graphqlData: unknown) {
  mockFetch
    .mockResolvedValueOnce(jsonResponse({ access_token: "tok_test", expires_in: 3600 }))
    .mockResolvedValueOnce(jsonResponse({ data: graphqlData }));
}

function parseToolResult(result: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(result.content[0]!.text);
}

// ── Build a wired-up MCP server with its own StitchClient ──────────────────

async function createTestHarness() {
  const stitchClient = new StitchClient({
    clientId: "test-id",
    clientSecret: "test-secret",
  });

  const server = new McpServer({ name: "stitch-payments-test", version: "0.0.0" });

  function errorResponse(err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const hint =
      err instanceof Error && err.name === "StitchAuthError"
        ? "\n\nHint: Check your STITCH_CLIENT_ID and STITCH_CLIENT_SECRET environment variables."
        : "";
    return { content: [{ type: "text" as const, text: `Error: ${message}${hint}` }] };
  }

  server.registerTool(
    "create_payment",
    {
      title: "Create payment",
      description: "Initiate a Stitch Pay By Bank payment request.",
      inputSchema: {
        amountCents: z.number().int().positive(),
        beneficiaryName: z.string().min(1).max(20),
        beneficiaryBankId: z.string().min(1),
        beneficiaryAccountNumber: z.string().min(1),
        payerReference: z.string().min(1).max(12),
        beneficiaryReference: z.string().min(1).max(20),
        externalReference: z.string().optional(),
      },
    },
    async (input) => {
      try {
        const amountQuantity = (input.amountCents / 100).toFixed(2);
        const mutation = `mutation CreatePaymentRequest($amount: MoneyInput!, $payerReference: String!, $beneficiaryReference: String!, $externalReference: String, $beneficiary: BankBeneficiaryInput!) { clientPaymentInitiationRequestCreate(input: { amount: $amount, payerReference: $payerReference, beneficiaryReference: $beneficiaryReference, externalReference: $externalReference, beneficiary: { bankAccount: $beneficiary } }) { paymentInitiationRequest { id url amount { quantity currency } payerReference beneficiaryReference state { __typename } createdAt } } }`;
        const data = await stitchClient.query(mutation, {
          amount: { quantity: amountQuantity, currency: "ZAR" },
          payerReference: input.payerReference,
          beneficiaryReference: input.beneficiaryReference,
          externalReference: input.externalReference ?? undefined,
          beneficiary: { name: input.beneficiaryName, bankId: input.beneficiaryBankId, accountNumber: input.beneficiaryAccountNumber },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify({ provider: "stitch", action: "create_payment", ...(data as Record<string, unknown>), requestedAt: isoNow() }, null, 2) }] };
      } catch (err) { return errorResponse(err); }
    }
  );

  server.registerTool(
    "check_payment_status",
    {
      title: "Check payment status",
      description: "Lookup payment status by ID",
      inputSchema: { paymentRequestId: z.string().min(1) },
    },
    async ({ paymentRequestId }) => {
      try {
        const query = `query GetPaymentStatus($id: ID!) { node(id: $id) { ... on PaymentInitiationRequest { id amount { quantity currency } payerReference beneficiaryReference state { __typename } createdAt updatedAt } } }`;
        const data = await stitchClient.query(query, { id: paymentRequestId });
        return { content: [{ type: "text" as const, text: JSON.stringify({ provider: "stitch", action: "check_payment_status", ...(data as Record<string, unknown>), checkedAt: isoNow() }, null, 2) }] };
      } catch (err) { return errorResponse(err); }
    }
  );

  server.registerTool(
    "list_transactions",
    {
      title: "List transactions",
      description: "List recent payment initiation requests",
      inputSchema: { first: z.number().int().positive().max(50).default(20), after: z.string().optional() },
    },
    async ({ first, after }) => {
      try {
        const query = `query ListPaymentRequests($first: Int!, $after: String) { client { paymentInitiationRequests(first: $first, after: $after) { edges { node { id amount { quantity currency } payerReference beneficiaryReference state { __typename } createdAt updatedAt } cursor } pageInfo { hasNextPage endCursor } } } }`;
        const data = await stitchClient.query(query, { first, after: after ?? null });
        return { content: [{ type: "text" as const, text: JSON.stringify({ provider: "stitch", action: "list_transactions", ...(data as Record<string, unknown>), queriedAt: isoNow() }, null, 2) }] };
      } catch (err) { return errorResponse(err); }
    }
  );

  const mcpClient = new Client({ name: "test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([mcpClient.connect(clientTransport), server.connect(serverTransport)]);

  return { mcpClient, server, cleanup: async () => { await mcpClient.close(); await server.close(); } };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Stitch MCP integration", () => {

  // ── create_payment ────────────────────────────────────────────────────

  describe("create_payment", () => {
    it("returns payment URL and metadata on success", async () => {
      const gqlData = {
        clientPaymentInitiationRequestCreate: {
          paymentInitiationRequest: {
            id: "cGF5bWVudC8xMjM=",
            url: "https://connect.stitch.money/pay/abc123",
            amount: { quantity: "150.00", currency: "ZAR" },
            payerReference: "INV-001",
            beneficiaryReference: "Order-42",
            state: { __typename: "PaymentInitiationRequestPending" },
            createdAt: "2026-02-27T14:00:00Z",
          },
        },
      };
      mockTokenThenGraphQL(gqlData);

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        const result = await mcpClient.callTool({
          name: "create_payment",
          arguments: {
            amountCents: 15000,
            beneficiaryName: "Test Shop",
            beneficiaryBankId: "fnb",
            beneficiaryAccountNumber: "62000000001",
            payerReference: "INV-001",
            beneficiaryReference: "Order-42",
          },
        });

        const parsed = parseToolResult(result as any);
        expect(parsed.provider).toBe("stitch");
        expect(parsed.action).toBe("create_payment");
        expect(parsed.clientPaymentInitiationRequestCreate.paymentInitiationRequest.id).toBe("cGF5bWVudC8xMjM=");
        expect(parsed.clientPaymentInitiationRequestCreate.paymentInitiationRequest.url).toContain("stitch.money");
        expect(parsed.requestedAt).toBeDefined();

        // Verify GraphQL variables
        const gqlCall = mockFetch.mock.calls[1]!;
        const body = JSON.parse(gqlCall[1].body);
        expect(body.variables.amount).toEqual({ quantity: "150.00", currency: "ZAR" });
        expect(body.variables.beneficiary.bankId).toBe("fnb");
      } finally { await cleanup(); }
    });

    it("returns error text on GraphQL failure", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 3600 }))
        .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "Invalid bank ID", extensions: { code: "BAD_REQUEST" } }] }));

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        const result = await mcpClient.callTool({
          name: "create_payment",
          arguments: {
            amountCents: 100,
            beneficiaryName: "X",
            beneficiaryBankId: "invalid",
            beneficiaryAccountNumber: "000",
            payerReference: "R1",
            beneficiaryReference: "B1",
          },
        });

        const text = (result as any).content[0].text;
        expect(text).toContain("Error:");
        expect(text).toContain("Invalid bank ID");
      } finally { await cleanup(); }
    });
  });

  // ── check_payment_status ──────────────────────────────────────────────

  describe("check_payment_status", () => {
    it("returns completed payment details", async () => {
      mockTokenThenGraphQL({
        node: {
          id: "cGF5bWVudC8xMjM=",
          amount: { quantity: "150.00", currency: "ZAR" },
          payerReference: "INV-001",
          beneficiaryReference: "Order-42",
          state: {
            __typename: "PaymentInitiationRequestCompleted",
            date: "2026-02-27T14:05:00Z",
            amount: { quantity: "150.00", currency: "ZAR" },
            payer: { accountNumber: "****1234", bankId: "fnb" },
          },
          createdAt: "2026-02-27T14:00:00Z",
          updatedAt: "2026-02-27T14:05:00Z",
        },
      });

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        const result = await mcpClient.callTool({
          name: "check_payment_status",
          arguments: { paymentRequestId: "cGF5bWVudC8xMjM=" },
        });

        const parsed = parseToolResult(result as any);
        expect(parsed.provider).toBe("stitch");
        expect(parsed.action).toBe("check_payment_status");
        expect(parsed.node.state.__typename).toBe("PaymentInitiationRequestCompleted");
        expect(parsed.checkedAt).toBeDefined();
      } finally { await cleanup(); }
    });

    it("returns pending state", async () => {
      mockTokenThenGraphQL({
        node: {
          id: "abc",
          amount: { quantity: "50.00", currency: "ZAR" },
          payerReference: "REF",
          beneficiaryReference: "BREF",
          state: { __typename: "PaymentInitiationRequestPending" },
          createdAt: "2026-02-27T14:00:00Z",
          updatedAt: "2026-02-27T14:00:00Z",
        },
      });

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        const result = await mcpClient.callTool({
          name: "check_payment_status",
          arguments: { paymentRequestId: "abc" },
        });

        const parsed = parseToolResult(result as any);
        expect(parsed.node.state.__typename).toBe("PaymentInitiationRequestPending");
      } finally { await cleanup(); }
    });

    it("returns auth error hint on 401", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ access_token: "tok", expires_in: 3600 }))
        .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        const result = await mcpClient.callTool({
          name: "check_payment_status",
          arguments: { paymentRequestId: "x" },
        });

        const text = (result as any).content[0].text;
        expect(text).toContain("Error:");
        expect(text).toContain("Hint:");
      } finally { await cleanup(); }
    });
  });

  // ── list_transactions ─────────────────────────────────────────────────

  describe("list_transactions", () => {
    it("returns paginated list of transactions", async () => {
      mockTokenThenGraphQL({
        client: {
          paymentInitiationRequests: {
            edges: [
              { node: { id: "pay1", amount: { quantity: "100.00", currency: "ZAR" }, payerReference: "REF1", beneficiaryReference: "BREF1", state: { __typename: "PaymentInitiationRequestCompleted" }, createdAt: "2026-02-27T10:00:00Z", updatedAt: "2026-02-27T10:05:00Z" }, cursor: "cur1" },
              { node: { id: "pay2", amount: { quantity: "200.00", currency: "ZAR" }, payerReference: "REF2", beneficiaryReference: "BREF2", state: { __typename: "PaymentInitiationRequestPending" }, createdAt: "2026-02-27T11:00:00Z", updatedAt: "2026-02-27T11:00:00Z" }, cursor: "cur2" },
            ],
            pageInfo: { hasNextPage: true, endCursor: "cur2" },
          },
        },
      });

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        const result = await mcpClient.callTool({
          name: "list_transactions",
          arguments: { first: 2 },
        });

        const parsed = parseToolResult(result as any);
        expect(parsed.provider).toBe("stitch");
        expect(parsed.action).toBe("list_transactions");
        expect(parsed.client.paymentInitiationRequests.edges).toHaveLength(2);
        expect(parsed.client.paymentInitiationRequests.pageInfo.hasNextPage).toBe(true);
        expect(parsed.queriedAt).toBeDefined();
      } finally { await cleanup(); }
    });

    it("passes pagination cursor", async () => {
      mockTokenThenGraphQL({
        client: { paymentInitiationRequests: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
      });

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        await mcpClient.callTool({
          name: "list_transactions",
          arguments: { first: 10, after: "cursor_abc" },
        });

        const gqlCall = mockFetch.mock.calls[1]!;
        const body = JSON.parse(gqlCall[1].body);
        expect(body.variables.after).toBe("cursor_abc");
      } finally { await cleanup(); }
    });

    it("uses default first=20 when omitted", async () => {
      mockTokenThenGraphQL({
        client: { paymentInitiationRequests: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
      });

      const { mcpClient, cleanup } = await createTestHarness();
      try {
        await mcpClient.callTool({
          name: "list_transactions",
          arguments: {},
        });

        const gqlCall = mockFetch.mock.calls[1]!;
        const body = JSON.parse(gqlCall[1].body);
        expect(body.variables.first).toBe(20);
      } finally { await cleanup(); }
    });
  });
});
