# CLAUDE.md - mcp-servers-za

## Project
Collection of MCP (Model Context Protocol) servers for South African services. Monorepo.

## Stack
TypeScript, Node.js, Vitest

## Commands
- `npm test` — run tests
- `npm run build` — build all packages

## Structure
- `packages/jse/` — JSE market data server
- `packages/stitch/` — Stitch payments server
- `packages/shared/` — shared utilities (cache, rate limiter, fetch utils)
- `site/` — documentation site
