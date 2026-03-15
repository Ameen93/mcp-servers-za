---
project: mcp-servers-za
type: features
status: mvp
stack: TypeScript, Node.js, MCP SDK, Zod, Vitest
domain: fintech, ai-tools, south-africa
last_analyzed: 2026-03-14
tags: mcp-servers-za, mcp, features, stitch, jse
---

# Features & Capabilities

## Implemented Features

### Stitch Payments Server (5 tools)
- **create_payment** — Initiate a payment via Stitch GraphQL API (amount in cents, beneficiary details, references); returns payment URL, request ID, state
- **check_payment_status** — Query payment state (pending/completed/cancelled/expired) with payer details and timestamps
- **list_transactions** — Paginated list of payment requests (cursor-based, max 50 per page)
- **initiate_refund** — Refund a payment with reason enum (DUPLICATE, FRAUDULENT, REQUESTED_BY_CUSTOMER, OTHER) and nonce for idempotency
- **create_debicheck_mandate** — Guidance-mode tool: returns instructions and docs link (DebiCheck requires user-facing auth flow)
- OAuth2 client credentials authentication with token caching and 30s pre-expiry refresh
- GraphQL query execution with error classification (auth errors, API errors)
- Resilient fetch with exponential backoff, timeouts, and 429 handling

### JSE Market Data Server (4 tools + 1 bonus)
- **get_quote** — Latest JSE stock price with OHLC, volume, change% (60s TTL cache)
- **get_historical** — Daily OHLCV bars for any JSE instrument (up to 20+ years with full output)
- **search_instruments** — Search by name or ticker, filtered to JSE results (Johannesburg region)
- **get_sens_announcements** — Guidance-mode: returns alternative data source suggestions (SENS requires commercial JSE license)
- **get_share_price** (bonus) — Pluggable data source architecture; currently returns mock data for NPN, SOL, AGL
- Alpha Vantage integration with built-in rate limiting (5 req/min) and TTL caching
- JSE symbol normalization (auto-adds `.JNB` suffix)

### Shared Infrastructure
- **Cache** — In-memory TTL-based with automatic expiration
- **RateLimiter** — Token bucket implementation respecting API quotas
- **fetchWithRetry** — Exponential backoff, timeout handling, Retry-After header support
- **npm publish readiness** — Both packages configured with bin entries, exports, types, publishConfig
- **Smoke test** — Stitch package has automated pack → install → run validation

## Partial / In Progress
- **Premium feature gating** — License key + middleware planned (Phase 3) but not implemented
- **get_share_price live data** — Interface exists (`SharePriceSource`) but only mock implementation available
- **Registry metadata + publishing pipeline** — npm packages configured but not yet published
- **Landing page** — HTML/CSS site exists but needs refinement

## Planned / TODO
- Premium feature gating with license key middleware
- npm registry publishing pipeline
- Documentation: install snippets for Claude Desktop / Cursor / other MCP clients
- Launch page with usage examples and pricing draft
- Live JSE data source implementation (replacing mock)
- SENS announcements integration (requires commercial JSE license)
- Full DebiCheck automation (requires user interaction flow design)

## Known Issues
- **Legacy packages** — `packages/stitch-mcp/` and `packages/jse-mcp/` are empty scaffolds with TODO comments; should be removed
- **Code duplication** — Stitch package duplicates fetch-utils and stitch-client from shared (intentional for standalone publishing, but maintenance overhead)
- **Mock-only share price** — `get_share_price` only returns hardcoded data for 3 tickers (NPN, SOL, AGL)
- **Alpha Vantage free tier limits** — 5 req/min and 500/day may be too restrictive for production use
- **No deployment instructions** — No Docker, Vercel, or containerization guides
