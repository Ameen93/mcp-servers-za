# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Monorepo of MCP (Model Context Protocol) servers for South African financial services. npm workspaces, TypeScript, ES modules (NodeNext).

## Commands

```bash
npm run build            # Build all packages (shared → stitch → jse)
npm test                 # Run all tests (vitest)
npm run typecheck        # Type-check without emitting
npm run clean            # Remove all dist/ directories

# Run a single test file
npx vitest run packages/shared/src/cache.test.ts

# Dev watch mode per server
npm run dev:stitch
npm run dev:jse

# Stitch publish smoke test (npm pack → temp install → run)
npm run smoke:fresh --workspace @mcp-servers-za/stitch
```

## Architecture

Three production packages plus a docs site:

- **`packages/shared/`** — Private utility library: in-memory TTL cache, token-bucket rate limiter, fetch with retry/backoff, Stitch OAuth2+GraphQL client, Alpha Vantage REST client. Not published.
- **`packages/stitch/`** — Stitch Payments MCP server (5 tools: create_payment, check_payment_status, list_transactions, initiate_refund, create_debicheck_mandate). Uses GraphQL + OAuth2 client credentials. Standalone — has its own `lib/` for env, fetch, and stitch-client instead of importing shared.
- **`packages/jse/`** — JSE Market Data MCP server (4 tools: get_quote, get_historical, search_instruments, get_sens_announcements). Imports from `@mcp-servers-za/shared`. Uses Alpha Vantage API (free tier: 5 req/min, 500/day).
- **`site/`** — Documentation site (served on :8787).

Dependency direction: `jse → shared`. Stitch is self-contained.

## MCP Server Pattern

Both servers follow the same structure:

1. Create `McpServer` with name/version from package.json
2. Register tools via `server.registerTool(name, { inputSchema: zodSchema }, handler)`
3. Handler returns `{ content: [{ type: "text", text: JSON.stringify(envelope) }] }`
4. Response envelopes include metadata: `{ provider, action, requestedAt/asOf, ...data }`
5. Connect with `StdioServerTransport` (stdio, not HTTP)
6. Entry points have `#!/usr/bin/env node` shebang and are configured as `bin` in package.json

## Environment Variables

- **Stitch:** `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`
- **JSE:** `ALPHA_VANTAGE_API_KEY`

Missing vars throw `ConfigError` with a hint message.

## TypeScript

Base config in `tsconfig.base.json`: target ES2022, module NodeNext, strict mode. Each package extends it, outputs to `dist/` with declarations. Node 18+.

## Testing

Vitest with globals enabled (no imports needed for `describe`, `it`, `expect`, `vi`). Tests live alongside source as `*.test.ts`. Uses `vi.useFakeTimers()` for time-dependent tests and fetch mocking for HTTP tests.

## Obsidian Vault Context

This project is tracked in the Obsidian vault at `/home/ameen/projects/`:
- **Project note:** `_notes/mcp-servers-za.md` — high-level status and notes
- **Dashboard:** `_index.md` — overview of all projects
- **Registry:** `projects.yaml` — metadata, status, relationships
- **Related:** mcpideas
