---
project: mcp-servers-za
type: ai-context
status: mvp
stack: TypeScript, Node.js, MCP SDK, Zod, Vitest
domain: fintech, ai-tools, south-africa
last_analyzed: 2026-03-14
tags: mcp-servers-za, mcp, stitch, jse, fintech, south-africa
---

# AI Context File — MCP Servers ZA

> This file is optimized for loading into an AI assistant to provide full project context.

## Project Identity
- **Name**: MCP Servers ZA
- **Domain**: Fintech AI tooling (SA-specific)
- **Status**: MVP (Phase 2 complete, Phase 3 in progress)
- **Stack**: TypeScript 5.9, Node.js 18+, MCP SDK, Zod, Vitest, npm workspaces
- **Location**: `/home/ameen/projects/mcp-servers-za/`

## One-Paragraph Summary
MCP Servers ZA is a TypeScript npm workspace monorepo providing the first South African-specific MCP (Model Context Protocol) servers. It includes a Stitch Payments server (5 tools: create_payment, check_payment_status, list_transactions, initiate_refund, create_debicheck_mandate) with OAuth2 client credentials auth and GraphQL queries, and a JSE Market Data server (4 tools + 1 mock bonus: get_quote, get_historical, search_instruments, get_sens_announcements, get_share_price) using Alpha Vantage with rate limiting and caching. Shared utilities provide TTL cache, token bucket rate limiter, and resilient HTTP fetch. Both servers are production-ready (~1,439 LOC, 22+ tests) and configured for npm publishing. Phase 3 focuses on premium feature gating and productization.

## Key Concepts & Terminology
- **MCP** — Model Context Protocol; standard for AI assistants to call tools
- **Stitch** — SA fintech platform for payments (stitch.money)
- **JSE** — Johannesburg Stock Exchange
- **SENS** — Stock Exchange News Service (JSE real-time announcements, requires commercial license)
- **DebiCheck** — SA authenticated debit order system (requires user-facing flow)
- **Alpha Vantage** — Free market data API (JSE data via `.JNB` suffix)
- **Guidance-mode tool** — Tool that returns instructions rather than executing (when full automation isn't possible)
- **SharePriceSource** — Pluggable interface for swapping mock/live JSE data

## Architecture in Brief
npm workspace monorepo with 3 packages: shared (cache, rate limiter, fetch, API clients), stitch (self-contained MCP server for payments), jse (MCP server for market data, imports shared). Both servers use stdio transport and register tools with Zod schemas. Stitch is self-contained (duplicates shared code) for independent npm publishing.

## Current Sprint / Focus
Phase 3 — Productization: premium feature gating (license key + middleware), npm registry publishing, documentation for MCP client setup, launch page with pricing.

## Important Constraints
- Alpha Vantage free tier: 5 req/min, 500 req/day
- SENS data requires commercial JSE license (tool returns guidance only)
- DebiCheck requires user-facing auth flow (tool returns guidance only)
- Stitch package intentionally duplicates shared code for standalone publishing
- No database — all state is in-memory (suitable for serverless)

## File Map (Key Files Only)

| Path | Purpose |
|------|---------|
| `packages/stitch/src/index.ts` | Stitch MCP server — all 5 tools (391 lines) |
| `packages/stitch/src/lib/stitch-client.ts` | OAuth2 + GraphQL client |
| `packages/stitch/src/lib/fetch-utils.ts` | Resilient HTTP with retry |
| `packages/stitch/src/integration.test.ts` | End-to-end MCP tests (356 lines) |
| `packages/jse/src/index.ts` | JSE MCP server — 4 tools + bonus (221 lines) |
| `packages/jse/src/share-price-source.ts` | Pluggable data source interface |
| `packages/jse/src/mock-share-price-source.ts` | Mock JSE data (NPN, SOL, AGL) |
| `packages/shared/src/cache.ts` | TTL cache implementation |
| `packages/shared/src/rate-limiter.ts` | Token bucket rate limiter |
| `packages/shared/src/alpha-vantage-client.ts` | JSE data API client |
| `.env.example` | Required environment variables |
| `CLAUDE.md` | Project instructions for Claude Code |
| `RESEARCH.md` | Market opportunity notes |
| `TASKS.md` | Phase breakdown and progress |
| `site/index.html` | Marketing landing page |
