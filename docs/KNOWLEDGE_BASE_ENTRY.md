---
project: mcp-servers-za
type: kb-entry
status: mvp
stack: TypeScript, Node.js, MCP SDK, Zod, Vitest
domain: fintech, ai-tools, south-africa
last_analyzed: 2026-03-14
tags: mcp-servers-za, mcp, stitch, jse, fintech, south-africa
---

# Knowledge Base Entry — MCP Servers ZA

> Canonical single-file reference for cross-project knowledge base.

## Tags
fintech, ai-tools, mcp, typescript, node, stitch, jse, south-africa, payments, market-data, mvp

## Summary
MCP Servers ZA provides the first SA-specific MCP servers: a Stitch Payments server (5 tools for payment creation, status, refunds, transactions, DebiCheck) and a JSE Market Data server (4 tools for quotes, historical data, instrument search, SENS guidance). Built as a TypeScript npm workspace monorepo with shared utilities (cache, rate limiter, resilient fetch). Both servers are production-ready with comprehensive tests and npm publish configuration. Pre-revenue, Phase 3 (productization) in progress.

## Relationships to Other Projects

| Project | Relationship |
|---------|-------------|
| `mcpideas` | Parent project — mcp-servers-za was spawned from mcpideas as the open-source/community MCP server collection |
| `fynkos` | Also spawned from mcpideas |
| `trading` | JSE market data tools could complement trading project's needs |
| `zarflipper` | ZAR-focused project; could use JSE data or Stitch payments |

## Reusable Patterns

1. **MCP server template** — Clean pattern for registering tools with Zod schemas, creating stdio transport, and handling errors with helpful hints. Reusable for any new MCP server.
2. **TTL Cache** — Simple `Map<string, {value, expiresAt}>` pattern with `JSON.stringify` keys. 38 lines, no dependencies.
3. **Token bucket rate limiter** — Tracks request timestamps, blocks when limit reached, calculates sleep time. 24 lines.
4. **fetchWithRetry** — Exponential backoff with timeout and Retry-After support. 46 lines.
5. **OAuth2 client credentials with pre-refresh** — Token caching with 30s pre-expiry buffer. Prevents mid-request failures.
6. **Guidance-mode tools** — For operations that can't be fully automated, return structured guidance instead of failing. Good UX pattern.
7. **Self-contained package publishing** — Duplicate shared code into a package for independent npm publishing. Trade-off but practical.
8. **Smoke test for npm packages** — Pack → install in clean dir → run → verify startup. Catches publish issues before they reach users.

## Lessons & Insights

- **First-mover advantage in niche MCP registries** — No SA-specific MCP servers exist. Being first establishes authority.
- **Guidance > failure** — When a tool can't fully automate something (SENS commercial license, DebiCheck user flow), returning guidance with alternatives is better than omitting the tool or returning an error.
- **Self-contained vs. shared code** — For npm-published packages, duplicating shared code removes the dependency chain headache for end users. Worth the maintenance cost for small utility functions.
- **Free API tiers work for MVP** — Alpha Vantage's 5 req/min is limiting but sufficient for validation. Upgrade path is clear.
- **Stateless = serverless-ready** — No database means the servers can run anywhere (stdio locally, potentially HTTP in the cloud) without infrastructure setup.
