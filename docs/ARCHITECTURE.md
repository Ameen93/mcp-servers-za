---
project: mcp-servers-za
type: architecture
status: mvp
stack: TypeScript, Node.js, MCP SDK, Zod, Vitest
domain: fintech, ai-tools, south-africa
last_analyzed: 2026-03-14
tags: mcp-servers-za, mcp, architecture, stitch, jse, fintech
---

# Architecture

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 18+ | Server execution |
| Language | TypeScript 5.9.2 (strict) | Type-safe development |
| MCP Protocol | @modelcontextprotocol/sdk 1.17 | MCP server implementation |
| Validation | Zod 3.23 | Runtime input schema validation |
| Test | Vitest 4.0 (globals) | Unit + integration testing |
| Build | tsc (ES2022, NodeNext) | TypeScript compilation |
| Monorepo | npm workspaces | Package management |
| Transport | StdioServerTransport | MCP communication (stdio) |

## System Diagram

```
┌──────────────────────────────────────────────┐
│          AI Assistant (Claude Desktop,        │
│           Cursor, GitHub Copilot)             │
└──────────────────┬───────────────────────────┘
                   │ MCP Protocol (stdio)
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────┐       ┌──────────────┐
│    Stitch    │       │     JSE      │
│   Payments   │       │  Market Data │
│  (5 tools)   │       │  (5 tools)   │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │                      ├── AlphaVantageClient
       │                      │   (cache + rate limit)
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│  Stitch API  │       │ Alpha Vantage│
│  (GraphQL)   │       │  (REST API)  │
│  OAuth2 CC   │       │  API key     │
└──────────────┘       └──────────────┘

┌──────────────────────────────────────────────┐
│              @mcp-servers-za/shared           │
│  ┌───────┐ ┌───────────┐ ┌──────────────┐   │
│  │ Cache │ │RateLimiter│ │fetchWithRetry│   │
│  │ (TTL) │ │(tok bucket)│ │(exp backoff) │   │
│  └───────┘ └───────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌─────────────────────┐    │
│  │StitchClient  │ │AlphaVantageClient   │    │
│  │(OAuth2+GQL)  │ │(REST+cache+ratelim) │    │
│  └──────────────┘ └─────────────────────┘    │
└──────────────────────────────────────────────┘
```

## Key Components

### Stitch MCP Server (`packages/stitch/`)
- **Entry**: `src/index.ts` (391 lines — all 5 tools registered inline)
- **Auth**: `src/lib/stitch-client.ts` — OAuth2 client credentials, token caching with 30s pre-expiry refresh
- **HTTP**: `src/lib/fetch-utils.ts` — Retry with exponential backoff, timeout, 429 handling
- **Config**: `src/lib/env.ts` — Zod-validated environment variables
- **Self-contained**: Duplicates shared code locally for standalone npm publishing

### JSE MCP Server (`packages/jse/`)
- **Entry**: `src/index.ts` (221 lines — 4 tools + SENS guidance + bonus share price)
- **Data Source**: Pluggable `SharePriceSource` interface (`src/share-price-source.ts`)
- **Mock Data**: `src/mock-share-price-source.ts` (NPN, SOL, AGL hardcoded)
- **Imports**: Uses `@mcp-servers-za/shared` for AlphaVantageClient, cache, rate limiter

### Shared Utilities (`packages/shared/`)
- **Cache** (`src/cache.ts`, 38 lines): In-memory Map with TTL expiration
- **RateLimiter** (`src/rate-limiter.ts`, 24 lines): Token bucket tracking timestamps
- **fetchWithRetry** (`src/fetch-utils.ts`, 46 lines): Exponential backoff, timeout, 429 Retry-After
- **StitchClient** (`src/stitch-client.ts`, 156 lines): OAuth2 + GraphQL executor
- **AlphaVantageClient** (`src/alpha-vantage-client.ts`, 191 lines): REST wrapper with built-in caching + rate limiting

## Data Model
No database — all computation is stateless. Token caching is in-memory only.

**Stitch entities**: PaymentRequest (ID, amount, state, dates, payer), Refund (ID, amount, status), DebiCheckMandate (guidance only)

**JSE entities**: Quote (ticker, price, OHLC, volume, change%), HistoricalBar (date, OHLCV), Instrument (ticker, name, region, type)

## External Dependencies

| Service | Role | Auth | Limits |
|---------|------|------|--------|
| Stitch API | SA payments (GraphQL) | OAuth2 client credentials | Production quotas |
| Alpha Vantage | JSE market data (REST) | API key | 5 req/min, 500/day (free) |
| JSE Direct | SENS announcements | Commercial license | Not integrated (guidance only) |

## Notable Patterns

1. **Self-contained publishing** — Stitch package duplicates shared code so it can be published independently to npm without requiring the shared package.
2. **Pluggable data sources** — JSE server uses a `SharePriceSource` interface, allowing mock ↔ live swaps via dependency injection.
3. **Token pre-refresh** — OAuth2 tokens refresh 30s before expiry to avoid mid-request failures.
4. **JSON.stringify cache keys** — Simple but effective: deterministic cache keys from API parameters.
5. **Response envelopes** — All tool responses wrapped in `{ provider, action, requestedAt, ...data }` for consistency.
6. **Guidance-mode tools** — Tools that can't be fully automated (SENS, DebiCheck) return guidance text + documentation links instead of failing silently.
