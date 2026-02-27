#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { isoNow, requiredEnv } from "./lib/env.js";
import { StitchClient } from "./lib/stitch-client.js";

const client = new StitchClient({
  clientId: requiredEnv("STITCH_CLIENT_ID"),
  clientSecret: requiredEnv("STITCH_CLIENT_SECRET"),
});

const server = new McpServer({
  name: "stitch-payments",
  version: "0.1.0",
});

function errorResponse(err: unknown): { content: Array<{ type: "text"; text: string }> } {
  const message =
    err instanceof Error ? err.message : String(err);
  const hint =
    err instanceof Error && err.name === "StitchAuthError"
      ? "\n\nHint: Check your STITCH_CLIENT_ID and STITCH_CLIENT_SECRET environment variables."
      : "";
  return {
    content: [{ type: "text", text: `Error: ${message}${hint}` }],
  };
}

// ── Create Payment ──────────────────────────────────────────────────────────

server.registerTool(
  "create_payment",
  {
    title: "Create payment",
    description:
      "Initiate a Stitch Pay By Bank payment request. Returns a payment URL for the payer to complete.",
    inputSchema: {
      amountCents: z.number().int().positive().describe("Amount in ZAR cents"),
      beneficiaryName: z.string().min(1).max(20),
      beneficiaryBankId: z.string().min(1).describe("Bank identifier e.g. 'nedbank', 'fnb', 'absa', 'capitec', 'standard_bank'"),
      beneficiaryAccountNumber: z.string().min(1),
      payerReference: z.string().min(1).max(12),
      beneficiaryReference: z.string().min(1).max(20),
      externalReference: z.string().optional(),
      payerId: z.string().optional().describe("Unique identifier for the payer on your system"),
    },
  },
  async (input) => {
    try {
      const amountQuantity = (input.amountCents / 100).toFixed(2);

      const mutation = `
        mutation CreatePaymentRequest(
          $amount: MoneyInput!,
          $payerReference: String!,
          $beneficiaryReference: String!,
          $externalReference: String,
          $beneficiary: BankBeneficiaryInput!
        ) {
          clientPaymentInitiationRequestCreate(input: {
            amount: $amount,
            payerReference: $payerReference,
            beneficiaryReference: $beneficiaryReference,
            externalReference: $externalReference,
            beneficiary: { bankAccount: $beneficiary }
          }) {
            paymentInitiationRequest {
              id
              url
              amount { quantity currency }
              payerReference
              beneficiaryReference
              state { __typename }
              createdAt
            }
          }
        }
      `;

      const variables = {
        amount: { quantity: amountQuantity, currency: "ZAR" },
        payerReference: input.payerReference,
        beneficiaryReference: input.beneficiaryReference,
        externalReference: input.externalReference ?? undefined,
        beneficiary: {
          name: input.beneficiaryName,
          bankId: input.beneficiaryBankId,
          accountNumber: input.beneficiaryAccountNumber,
        },
      };

      const data = await client.query(mutation, variables);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "stitch",
                action: "create_payment",
                ...(data as Record<string, unknown>),
                requestedAt: isoNow(),
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

// ── Check Payment Status ────────────────────────────────────────────────────

server.registerTool(
  "check_payment_status",
  {
    title: "Check payment status",
    description: "Lookup payment status by payment request ID",
    inputSchema: {
      paymentRequestId: z.string().min(1).describe("The base64 payment request ID from Stitch"),
    },
  },
  async ({ paymentRequestId }) => {
    try {
      const query = `
        query GetPaymentStatus($id: ID!) {
          node(id: $id) {
            ... on PaymentInitiationRequest {
              id
              amount { quantity currency }
              payerReference
              beneficiaryReference
              state {
                __typename
                ... on PaymentInitiationRequestCompleted {
                  date
                  amount { quantity currency }
                  payer {
                    ... on PaymentInitiationBankAccountPayer {
                      accountNumber
                      bankId
                    }
                  }
                }
                ... on PaymentInitiationRequestCancelled {
                  date
                  reason
                }
                ... on PaymentInitiationRequestExpired {
                  date
                }
              }
              createdAt
              updatedAt
            }
          }
        }
      `;

      const data = await client.query(query, { id: paymentRequestId });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "stitch",
                action: "check_payment_status",
                ...(data as Record<string, unknown>),
                checkedAt: isoNow(),
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

// ── List Transactions (Payment Initiation Requests) ─────────────────────────

server.registerTool(
  "list_transactions",
  {
    title: "List transactions",
    description: "List recent payment initiation requests",
    inputSchema: {
      first: z.number().int().positive().max(50).default(20),
      after: z.string().optional().describe("Pagination cursor"),
    },
  },
  async ({ first, after }) => {
    try {
      const query = `
        query ListPaymentRequests($first: Int!, $after: String) {
          client {
            paymentInitiationRequests(first: $first, after: $after) {
              edges {
                node {
                  id
                  amount { quantity currency }
                  payerReference
                  beneficiaryReference
                  state { __typename }
                  createdAt
                  updatedAt
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `;

      const data = await client.query(query, { first, after: after ?? null });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "stitch",
                action: "list_transactions",
                ...(data as Record<string, unknown>),
                queriedAt: isoNow(),
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

// ── Initiate Refund ─────────────────────────────────────────────────────────

server.registerTool(
  "initiate_refund",
  {
    title: "Initiate refund",
    description: "Create a refund for a completed Pay By Bank payment",
    inputSchema: {
      paymentRequestId: z.string().min(1),
      amountCents: z.number().int().positive().describe("Refund amount in ZAR cents"),
      reason: z.enum([
        "DUPLICATE",
        "FRAUDULENT",
        "REQUESTED_BY_CUSTOMER",
        "OTHER",
      ]),
      nonce: z.string().min(1).describe("Unique idempotency key for this refund"),
      beneficiaryReference: z.string().min(1).max(20).describe("Reference shown on payer bank statement"),
    },
  },
  async (input) => {
    try {
      const amountQuantity = (input.amountCents / 100).toFixed(2);

      const mutation = `
        mutation InitiateRefund(
          $paymentRequestId: ID!,
          $amount: MoneyInput!,
          $reason: RefundReason!,
          $nonce: String!,
          $beneficiaryReference: String!
        ) {
          clientRefundInitiate(input: {
            paymentRequestId: $paymentRequestId,
            amount: $amount,
            reason: $reason,
            nonce: $nonce,
            beneficiaryReference: $beneficiaryReference
          }) {
            refund {
              id
              amount { quantity currency }
              status { __typename }
              createdAt
            }
          }
        }
      `;

      const data = await client.query(mutation, {
        paymentRequestId: input.paymentRequestId,
        amount: { quantity: amountQuantity, currency: "ZAR" },
        reason: input.reason,
        nonce: input.nonce,
        beneficiaryReference: input.beneficiaryReference,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "stitch",
                action: "initiate_refund",
                ...(data as Record<string, unknown>),
                requestedAt: isoNow(),
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

// ── Create VRP / DebiCheck Mandate ──────────────────────────────────────────

server.registerTool(
  "create_debicheck_mandate",
  {
    title: "Create DebiCheck mandate",
    description:
      "Create a recurring payment consent request (DebiCheck mandate). Note: requires client_recurringpaymentconsentrequest scope.",
    inputSchema: {
      payerName: z.string().min(1),
      payerBankId: z.string().min(1),
      payerAccountNumber: z.string().min(1),
      maxAmountCents: z.number().int().positive(),
      description: z.string().min(1),
    },
  },
  async (input) => {
    try {
      // DebiCheck mandates require user interaction flow — provide guidance
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                provider: "stitch",
                action: "create_debicheck_mandate",
                status: "guidance",
                message:
                  "DebiCheck mandate creation requires the client_recurringpaymentconsentrequest scope and involves a user-facing authentication flow. " +
                  "This cannot be fully automated via API alone. Please refer to Stitch documentation at https://docs.stitch.money/payment-products/payins/debicheck/introduction " +
                  "for the full integration guide.",
                input,
                queriedAt: isoNow(),
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("stitch-mcp fatal error", err);
  process.exit(1);
});
