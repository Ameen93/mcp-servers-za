# MCP Servers ZA 🇿🇦

> Production-ready Model Context Protocol (MCP) servers for South African services.

## The Problem

AI agents and workflows targeting the South African market need to integrate with local services — payments, market data, tax, load shedding — but **zero SA-specific MCP servers exist** in any registry. Developers are forced to build custom integrations from scratch.

## The Solution

A collection of production-ready MCP servers for SA services, published as npm packages and listed on the [official MCP Registry](https://registry.modelcontextprotocol.io). Plug into any MCP-compatible AI agent (Claude, ChatGPT, Copilot, etc.) and interact with SA services via natural language.

## First Servers

### 🏦 Stitch Payments MCP (`@mcp-servers-za/stitch`)
- `create_payment` — Initiate EFT or card payments
- `check_payment_status` — Check payment status by ID
- `create_vrp_mandate` — Set up Variable Recurring Payment mandates
- `list_transactions` — List and filter transactions
- `initiate_refund` — Process refunds

### 📈 JSE Market Data MCP (`@mcp-servers-za/jse`)
- `get_quote` — Real-time/delayed quotes for JSE-listed instruments
- `get_historical` — Historical price data (OHLCV)
- `search_instruments` — Search stocks, ETFs, bonds by name/ticker
- `get_sens_announcements` — SENS news and corporate announcements

## Roadmap

- 🧾 **SARS Tax MCP** — Tax calculations, filing status, compliance checks
- ⚡ **Eskom Load Shedding MCP** — Schedules, stages, area lookups
- 💚 **Discovery Vitality MCP** — Points, status, rewards

## Monetization

| Tier | What You Get |
|------|-------------|
| **Free / OSS** | Core tools for each server — fully functional |
| **Premium** | Webhooks, advanced queries, batch operations, priority support |
| **Enterprise** | Dedicated support, SLAs, custom integrations |

Premium features are gated via license key. Core functionality is and will always be free and open source.

## Tech Stack

- **TypeScript** / Node.js
- **@modelcontextprotocol/sdk** — Official MCP SDK
- **Monorepo** — `packages/*` workspaces
- Published as **npm packages**
- Listed on the **official MCP Registry**

## Getting Started

```bash
npm install @mcp-servers-za/stitch
# or
npm install @mcp-servers-za/jse
```

## Development

```bash
git clone https://github.com/your-org/mcp-servers-za.git
cd mcp-servers-za
npm install
```

## License

MIT
