# MCP Servers ZA 🇿🇦

> Production-ready Model Context Protocol (MCP) servers for South African services.

## Current Status

- ✅ Monorepo scaffolded
- ✅ Stitch MCP tool surfaces implemented (stubbed)
- ✅ JSE MCP tool surfaces implemented (stubbed)
- ⏳ Real API integrations pending
- ⏳ MCP Registry publishing pending

## Packages

- `@mcp-servers-za/stitch`
  - `create_payment`
  - `check_payment_status`
  - `create_vrp_mandate`
  - `list_transactions`
  - `initiate_refund`
- `@mcp-servers-za/jse`
  - `get_quote`
  - `get_historical`
  - `search_instruments`
  - `get_sens_announcements`

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

## Notes

The current implementation intentionally returns structured stub payloads so:

1. MCP schema and client UX can be validated early.
2. Real provider wiring can happen incrementally without changing tool contracts.

## License

MIT
