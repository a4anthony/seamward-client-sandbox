# Candidate ATS Sandbox

A standalone TypeScript service that receives synthetic candidate webhooks. It is intentionally small, production-shaped, and independent of any monitoring or observability product.

## What the service does

The API accepts four candidate operations:

| Operation | Route | Result |
| --- | --- | --- |
| `candidate.create` | `POST /webhooks/candidates` | Creates a candidate |
| `candidate.update` | `POST /webhooks/candidates` | Updates a candidate |
| `candidate.status_changed` | `POST /webhooks/candidates/status` | Changes candidate status |
| `candidate.document_uploaded` | `POST /webhooks/documents` | Records a document |

The OpenAPI description lives in `contracts/candidate-ats-v1.openapi.json`.

The sandbox also provides deterministic test controls for authentication failures, slow processing, and silent success responses. All data is synthetic and stored in memory.

## Requirements

- Node.js 22 or newer
- pnpm 11.19.0

## Install

```bash
pnpm install --frozen-lockfile
```

The service uses port `4200` by default. To enable the synthetic failure controls, set `ENABLE_TEST_CONTROLS=true` in your local runtime configuration.

## Run

```bash
pnpm dev
```

The default address is `http://127.0.0.1:4200`.

From another terminal, send healthy traffic:

```bash
pnpm send:healthy
pnpm send:update
pnpm send:status
pnpm send:document
```

Trigger controlled scenarios:

```bash
pnpm send:rename
pnpm send:silent
pnpm send:latency
pnpm send:retries
```

Reset the in-memory state:

```bash
pnpm reset
```

## Verify

```bash
pnpm verify
```

This runs the tests, TypeScript checks, and production build.

## Docker

```bash
docker compose up --build
```

The container exposes the service on port `4200`.
