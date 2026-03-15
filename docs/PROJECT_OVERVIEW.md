---
project: mcp-servers-za
type: overview
status: mvp
stack: TypeScript, Node.js, MCP SDK, Zod, Vitest
domain: fintech, ai-tools, south-africa
last_analyzed: 2026-03-14
tags: mcp-servers-za, mcp, stitch, jse, fintech, south-africa, payments, market-data
---

# MCP Servers ZA
> Production-grade MCP servers for South African financial services — Stitch Payments and JSE market data.

## What This Is
MCP Servers ZA is a TypeScript monorepo providing the first SA-specific Model Context Protocol servers. It enables AI assistants (Claude Desktop, Cursor, GitHub Copilot) to interact with South African financial platforms — currently Stitch for payments and Alpha Vantage for JSE market data.

The project occupies a greenfield position: no SA-specific MCP servers exist in any registry. Both servers are production-ready with OAuth2 authentication, rate limiting, TTL caching, retry logic, and comprehensive error handling. The Stitch server supports payment initiation, status checking, refunds, and DebiCheck mandates. The JSE server provides real-time quotes, historical data, and instrument search.

Built as an npm workspace monorepo with shared utilities, both servers are configured for npm publishing and include smoke tests for publish-readiness validation.

## Problem It Solves
AI agent builders in South Africa have zero ready-made MCP integrations for local financial services. Building payment flows or market data queries into AI workflows requires custom code for each platform. MCP Servers ZA provides drop-in, production-quality servers that any MCP-compatible AI assistant can use immediately.

## Target User
- AI agent builders using Claude Desktop, Cursor, or similar MCP clients
- SA fintech companies wanting agent-automated payment flows via Stitch
- Investment/trading firms needing JSE data in AI workflows
- Enterprise teams wanting governed, SA-first AI operations

## Current Status
**MVP** — Phase 2 complete (core integrations done), Phase 3 in progress (productization). Both servers are production-ready with tests. ~1,439 lines of TypeScript, 11 commits, last activity Feb 27, 2026. Premium feature gating and npm publishing pipeline are next.

## Key Links & Entry Points

| Item | Path |
|------|------|
| Stitch MCP Server | `packages/stitch/src/index.ts` |
| JSE MCP Server | `packages/jse/src/index.ts` |
| Shared Utilities | `packages/shared/src/index.ts` |
| Landing Page | `site/index.html` |
| README | `README.md` |
| CLAUDE.md | `CLAUDE.md` |
| Research Notes | `RESEARCH.md` |
| Task Tracker | `TASKS.md` |
| Environment Template | `.env.example` |
