# MCP Servers ZA 🇿🇦

> Production-ready Model Context Protocol (MCP) servers for South African services.

## Current Status

- ✅ Monorepo scaffolded
- ✅ Stitch MCP tool surfaces implemented (stubbed)
- ✅ JSE MCP tool surfaces implemented (stubbed)
- ⏳ Real API integrations pending
- ⏳ MCP Registry publishing pending

## Package map

- `packages/shared` → `@mcp-servers-za/shared` (shared types/utilities)
- `packages/stitch` → `@mcp-servers-za/stitch` (Stitch MCP server)
  - `create_payment`
  - `check_payment_status`
  - `create_vrp_mandate`
  - `list_transactions`
  - `initiate_refund`
- `packages/jse` → `@mcp-servers-za/jse` (JSE MCP server)
  - `get_quote`
  - `get_historical`
  - `search_instruments`
  - `get_sens_announcements`
- `site/` → static docs/landing page scaffold

## Quick start

```bash
cd ~/projects/mcp-servers-za
npm install
cp .env.example .env
# add STITCH_API_KEY and JSE_API_KEY
npm run build
```

Run Stitch server (stdio MCP):

```bash
npm run dev:stitch
```

Run JSE server (stdio MCP):

```bash
npm run dev:jse
```

## Testing

```bash
npm test
```

**Current strategy:** Placeholder script that exits 0. No test framework is configured yet. As real API integrations land, we'll add a proper test runner (likely Vitest) with unit tests per package. The placeholder ensures CI pipelines and ops scans don't hard-fail on a missing `test` script.

## Notes

The current implementation intentionally returns structured stub payloads so:

1. MCP schema and client UX can be validated early.
2. Real provider wiring can happen incrementally without changing tool contracts.

## License

MIT
