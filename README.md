# Seamward Client Sandbox

A standalone TypeScript service with three production-shaped integration boundaries. The checked-in baseline intentionally contains no Seamward collector, generated setup files, MCP configuration, or runtime credentials. It can therefore be used repeatedly to test automatic Seamward setup from a clean repository.

## Integrations in the baseline

| Integration | Direction | Protocol | Source boundary | Contract |
| --- | --- | --- | --- | --- |
| Candidate ATS | Inbound | HTTP webhook | `src/candidate-ats-webhooks.ts` | `contracts/candidate-ats-v1.openapi.json` |
| Payment notifications | Inbound | HTTP webhook | `src/payment-notifications-webhooks.ts` | `contracts/payment-notifications-v1.openapi.json` |
| Customer notifications | Outbound | HTTP API | `src/customer-notifications.ts` | `contracts/customer-notifications-v1.openapi.json` |

Candidate ATS accepts create, update, status change, and document upload events. Payment notifications accepts succeeded, failed, and refunded events. Customer notifications calls a provider's `POST /v1/messages` API.

All test data is synthetic. Candidate and payment state is stored in memory.

## Requirements

- Node.js 22 or newer
- pnpm 11.19.0

## Install

```bash
pnpm install --frozen-lockfile
```

## Run

```bash
pnpm dev
```

The default address is `http://127.0.0.1:4200`. To use the synthetic failure controls, set `ENABLE_TEST_CONTROLS=true` in your local runtime configuration or run:

```bash
pnpm dev:test-controls
```

## Send test traffic

With the sandbox running in another terminal, exercise both inbound integrations:

```bash
pnpm send:healthy
pnpm send:update
pnpm send:status
pnpm send:document
pnpm send:payment
```

Exercise the outbound customer notification integration. This script starts a temporary local provider, sends one notification, and then shuts the provider down:

```bash
pnpm send:notification
```

Trigger controlled Candidate ATS scenarios:

```bash
pnpm send:rename
pnpm send:silent
pnpm send:latency
pnpm send:retries
```

Reset in-memory state:

```bash
pnpm reset
```

## Verify the baseline

```bash
pnpm verify
```

This runs the complete test suite, TypeScript checks, and the production build.

## Test automatic Seamward setup

Install and authenticate the current alpha CLI, then configure the project:

```bash
npm install --global @seamward/cli@alpha
seamward login
seamward setup
```

Open Claude Code from this repository, reconnect the `seamward-setup` MCP server if prompted, and send this single prompt:

```text
Set up Seamward in this project.
```

The automatic setup should propose the three integrations listed above. Review the proposed local and remote changes before approving them.

## Docker

```bash
docker compose up --build
```

The container exposes the service on port `4200`.
