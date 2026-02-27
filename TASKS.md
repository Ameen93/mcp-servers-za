# Tasks

## Phase 1: Foundation (done)

- [x] 1. Monorepo structure + TypeScript build chain
- [x] 2. Stitch MCP package scaffolded
- [x] 3. JSE MCP package scaffolded
- [x] 4. Core tool schemas implemented for both servers

## Phase 2: Real integrations (done)

- [x] 5. Stitch API client (OAuth2 client credentials, GraphQL, auto-refresh, retry)
- [x] 6. JSE data provider: Alpha Vantage (.JNB suffix) + client with caching & rate limiting
- [x] 7. Normalized error handling + retry/rate-limit strategy (shared fetch-utils)
- [x] 8. Unit tests for shared utilities (cache, rate-limiter, fetch, stitch-client, alpha-vantage-client)
- [x] 9. Tests with mocked HTTP responses (22 tests passing)
- [x] 10. Stitch tools: create_payment, check_payment_status, list_transactions, initiate_refund, create_debicheck_mandate
- [x] 11. JSE tools: get_quote, get_historical, search_instruments, get_sens_announcements (stub with guidance)
- [x] 12. Updated .env.example, README, TASKS.md

## Phase 3: Productization

- [ ] 13. Premium feature gating (license key + middleware)
- [ ] 14. Registry metadata + publishing pipeline
- [ ] 15. Docs: install snippets for Claude Desktop / Cursor / other MCP clients
- [ ] 16. Launch page + usage examples + pricing page draft
