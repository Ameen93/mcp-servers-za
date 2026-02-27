# @mcp-servers-za/jse

JSE Market Data MCP server for South African financial data workflows.

## What this server exposes

- `get_quote` — Get the latest quote for a JSE-listed instrument
- `get_historical` — Retrieve daily OHLCV history for a JSE ticker
- `search_instruments` — Search for JSE-listed instruments by name or ticker
- `get_sens_announcements` — SENS announcements (guidance — not yet available via free API)

## Data Provider

Uses [Alpha Vantage](https://www.alphavantage.co/) as the data backend. Free tier limits: 5 requests/minute, 500/day.

## Authentication

Required environment variable:

- `ALPHA_VANTAGE_API_KEY` — Get a free key at https://www.alphavantage.co/support/#api-key

## Install

```bash
npm install @mcp-servers-za/jse
```

## Run locally

```bash
ALPHA_VANTAGE_API_KEY=your_key mcp-servers-za-jse
```

## MCP client config example

```json
{
  "mcpServers": {
    "jse-market-data": {
      "command": "mcp-servers-za-jse",
      "env": {
        "ALPHA_VANTAGE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Tool usage examples

### Get quote

```json
{ "ticker": "NPN" }
```

### Get historical prices

```json
{ "ticker": "SOL", "days": 30, "outputSize": "compact" }
```

### Search instruments

```json
{ "query": "naspers" }
```
