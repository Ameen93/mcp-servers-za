---
project: mcp-servers-za
type: decisions
status: mvp
stack: TypeScript, Node.js, MCP SDK, Zod, Vitest
domain: fintech, ai-tools, south-africa
last_analyzed: 2026-03-14
tags: mcp-servers-za, mcp, decisions, stitch, jse
---

# Decision Log

> Architectural and product decisions inferred from the codebase.

## Tech Stack Choices

**TypeScript + MCP SDK** — The official MCP SDK is TypeScript-first; natural choice for building MCP servers. Strict mode enabled for type safety.

**npm workspaces** — Lightweight monorepo management without Turborepo/Nx overhead. Three packages (shared, stitch, jse) with clear dependency hierarchy.

**Alpha Vantage for JSE data** — Free tier provides JSE data (via `.JNB` ticker suffix). Chosen over direct JSE feed (requires commercial license) and Sharenet (no API). Trade-off: limited to 5 req/min but sufficient for MVP.

**Vitest with globals** — Fast, ESM-native test runner. Globals enabled to avoid import boilerplate in test files.

**No database** — Stateless design with in-memory caching. Makes servers suitable for serverless deployment and simplifies the architecture.

## Notable Implementation Choices

**Self-contained Stitch package** — Stitch duplicates `fetch-utils`, `stitch-client`, and `env` from the shared package. This allows publishing `@mcp-servers-za/stitch` to npm as a standalone package without requiring users to install the shared library. Trade-off: code duplication vs. publishing simplicity.

**Guidance-mode tools** — Instead of omitting tools that can't be fully automated (SENS announcements, DebiCheck mandates), the servers expose them as guidance tools that return instructions, alternative data sources, and documentation links. Better UX than silent omission.

**Token pre-refresh (30s buffer)** — OAuth2 tokens refresh 30 seconds before actual expiry. Prevents edge cases where a token expires during a long GraphQL request. Simple but effective.

**Response envelopes** — All tool responses wrapped in `{ provider, action, requestedAt/asOf, ...data }`. Provides consistent structure and metadata for AI assistants to parse.

**GraphQL over REST for Stitch** — Stitch's API is GraphQL-native. The client builds queries as template literals with proper variable handling, rather than using a GraphQL client library (keeps dependencies minimal).

## Open Questions

1. **Code duplication maintenance** — How to keep stitch's local copies of shared code in sync? Should a build-time copy script be added?
2. **Alpha Vantage vs. premium data** — When should the JSE server upgrade from free Alpha Vantage to a commercial data source? At what user volume?
3. **Legacy packages** — `stitch-mcp` and `jse-mcp` directories are empty scaffolds; should be removed before npm publish.
4. **Premium gating mechanism** — License key middleware is planned but no design exists. How should it work for stdio-transport servers?
5. **HTTP transport** — Stdio works for desktop MCP clients, but cloud/remote scenarios need HTTP. When to add?
6. **Relationship with mcpideas** — mcp-servers-za was spawned from mcpideas. How do these projects relate going forward? Is mcp-servers-za the open-source community offering while mcpideas/ContextForge is the enterprise consulting arm?
