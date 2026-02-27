# MCP Servers ZA 🇿🇦

A collection of [Model Context Protocol](https://modelcontextprotocol.io/) servers for South African services.

## Servers

### Stitch Payments (`@mcp-servers-za/stitch`)

MCP server for [Stitch](https://stitch.money) payment operations:

- **create_payment** — Initiate a Pay By Bank payment request
- **check_payment_status** — Look up payment status by ID
- **list_transactions** — List recent payment initiation requests
- **initiate_refund** — Refund a completed payment
- **create_debicheck_mandate** — Guidance for recurring payment setup

### JSE Market Data (`@mcp-servers-za/jse`)

MCP server for Johannesburg Stock Exchange market data (via [Alpha Vantage](https://www.alphavantage.co/)):

- **get_quote** — Latest quote for a JSE ticker
- **get_historical** — Daily OHLCV history
- **search_instruments** — Search JSE-listed instruments
- **get_sens_announcements** — SENS info (premium feature placeholder)

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/your-org/mcp-servers-za.git
cd mcp-servers-za
npm install
npm run build
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Stitch:** Get your `client_id` and `client_secret` from the [Stitch Dashboard](https://dashboard.stitch.money).

**Alpha Vantage:** Get a free API key at [alphavantage.co/support](https://www.alphavantage.co/support/#api-key). Free tier: 5 requests/minute, 500/day.

### Running

```bash
# Stitch MCP server
STITCH_CLIENT_ID=xxx STITCH_CLIENT_SECRET=yyy node packages/stitch/dist/index.js

# JSE MCP server
ALPHA_VANTAGE_API_KEY=zzz node packages/jse/dist/index.js
```

### Claude Desktop / Cursor Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "stitch-payments": {
      "command": "node",
      "args": ["/path/to/mcp-servers-za/packages/stitch/dist/index.js"],
      "env": {
        "STITCH_CLIENT_ID": "your-client-id",
        "STITCH_CLIENT_SECRET": "your-client-secret"
      }
    },
    "jse-market-data": {
      "command": "node",
      "args": ["/path/to/mcp-servers-za/packages/jse/dist/index.js"],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

```bash
npm run build      # Build all packages
npm test           # Run tests (vitest)
npm run typecheck   # Type check without emitting
```

## Architecture

```
packages/
  shared/     — Common utilities (HTTP client, cache, rate limiter, API clients)
  stitch/     — Stitch Payments MCP server
  jse/        — JSE Market Data MCP server
  stitch-mcp/ — (Legacy wrapper, unused)
  jse-mcp/    — (Legacy wrapper, unused)
```

## License

MIT
