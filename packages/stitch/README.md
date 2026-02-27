# @mcp-servers-za/stitch

Stitch Payments MCP server for South African payment workflows.

## What this server exposes

- `create_payment` — Create a Pay by Bank payment request
- `check_payment_status` — Fetch payment status by Stitch payment request ID
- `list_transactions` — List recent payment initiation requests
- `initiate_refund` — Trigger a refund for a completed payment
- `create_debicheck_mandate` — Guidance output for DebiCheck mandate flow

## Authentication

This server uses Stitch OAuth client credentials.

Required environment variables:

- `STITCH_CLIENT_ID`
- `STITCH_CLIENT_SECRET`

Get these from the Stitch Dashboard for your app/environment.

## Install

```bash
npm install @mcp-servers-za/stitch
```

## Run locally

```bash
STITCH_CLIENT_ID=your_client_id \
STITCH_CLIENT_SECRET=your_client_secret \
mcp-servers-za-stitch
```

## MCP client config example

```json
{
  "mcpServers": {
    "stitch-payments": {
      "command": "mcp-servers-za-stitch",
      "env": {
        "STITCH_CLIENT_ID": "your-client-id",
        "STITCH_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

## Tool usage examples

### Create payment

```json
{
  "amountCents": 159900,
  "beneficiaryName": "Acme Pty Ltd",
  "beneficiaryBankId": "nedbank",
  "beneficiaryAccountNumber": "1234567890",
  "payerReference": "INV-1023",
  "beneficiaryReference": "ACME-1023",
  "externalReference": "order-1023"
}
```

### Check status

```json
{
  "paymentRequestId": "UGF5bWVudEluaXRpYXRpb25SZXF1ZXN0OjEyMzQ="
}
```

### Refund

```json
{
  "paymentRequestId": "UGF5bWVudEluaXRpYXRpb25SZXF1ZXN0OjEyMzQ=",
  "amountCents": 5000,
  "reason": "REQUESTED_BY_CUSTOMER",
  "nonce": "refund-1023-1",
  "beneficiaryReference": "REFUND-1023"
}
```

## Publish-readiness smoke test (fresh install path)

From this package directory:

```bash
npm run build
npm run smoke:fresh
```

What this does:
1. Packs the package as a tarball.
2. Installs it into a temporary clean project.
3. Starts the installed CLI with dummy credentials.
4. Verifies process starts cleanly, then exits.
