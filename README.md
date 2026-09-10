# MCP Servers ZA 🇿🇦

Model Context Protocol servers for South African financial rails, built on the assumption that an agent holding a payment tool will eventually be asked to do something it should refuse.

Most MCP servers are a thin wrapper over an API. That is fine for reading a calendar. It is not fine for moving money, where the interesting questions are what the tool refuses, what it does twice, and what it can prove afterwards. This repo is an attempt to answer those three questions in public, with tests.

## What is here today

A TypeScript monorepo, npm workspaces, strict TS, vitest.

| Package | What it is | Tools |
|---|---|---|
| `@mcp-servers-za/stitch` | MCP server over stdio for [Stitch](https://stitch.money) payments | `create_payment`, `check_payment_status`, `list_transactions`, `initiate_refund`, `create_debicheck_mandate` |
| `@mcp-servers-za/jse` | MCP server over stdio for JSE market data | `get_quote`, `get_historical`, `search_instruments`, `get_sens_announcements` |
| `@mcp-servers-za/shared` | The parts that are easy to get wrong | HTTP client with retry, token-bucket rate limiter, response cache, typed API clients |

Tool inputs are Zod schemas. Responses distinguish a real answer from `not_available`, because a market-data tool that invents a price is worse than one that declines. There are unit tests for the rate limiter, cache, fetch layer and both API clients, plus integration tests that run the servers against recorded HTTP responses.

```bash
npm install
npm run build
npm test
npm run dev:stitch      # or dev:jse
```

Credentials go in `.env`; see `.env.example`. Neither server needs credentials to run its tests.

## What is deliberately not here yet

Being early is not the same as being vague, so the gaps are listed rather than implied.

- **Live API integration.** The client layer is real and tested against recorded responses. It has not yet been run against production Stitch or JSE credentials.
- **The trust core.** The design is settled and the code is next: policy limits enforced server-side, an idempotency store so a replayed call returns the first result rather than a second payment, an append-only hash-chained audit log, and a hard separation between a dry run that returns a preview and an execute that requires an explicit approval step.
- **The eval suite.** A public, runnable set of graded tasks: what the agent does when a tool result tries to talk it into a refund it was never asked for, when a limit is exceeded, when a webhook arrives twice, when the rail returns a partial failure. Passing rates published in this README, including the failures.
- **Registry publishing.** Not until the above holds.

## Roadmap

| Date | Milestone |
|---|---|
| 22 Sep 2026 | `v0.1`: CI on main, one runnable read-only tool end to end, install instructions that work from a clean clone |
| 9 Oct 2026 | `v0.2`: the trust core above, a mock rail with inspectable state, contract tests, and the first published eval results |

## Why South African rails

Because nobody else is building them, and because the constraints here are specific: DebiCheck mandates, the National Credit Act, POPIA, and a payments landscape where the useful integrations are Stitch, Peach, Ozow and the card acquirers rather than Stripe. Agent tooling written for US rails does not transfer cleanly.

## Design notes

- **Read and write tools are separate surfaces.** A read tool can be given away freely; a write tool cannot.
- **Dry run is the default.** Execute is an explicit, separately named operation.
- **Idempotency is required, not optional.** A caller without a key gets an error, not a payment.
- **Every refusal has a reason code** and lands in the audit log next to the request that caused it.
- **Nothing is logged that should not be.** Account numbers and personal data are masked at the boundary.

## Status

Pre-release and moving. Interfaces will change until `v0.2`. Issues and opinions welcome, particularly from anyone who has run payment integrations in South Africa and knows where the bodies are.

MIT licensed. Built by [Ameen Solomon](https://github.com/Ameen93), Cape Town.
