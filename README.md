# Seamward Client Sandbox

A standalone, production-shaped ATS webhook consumer for demonstrating the full Seamward contract and incident pipeline against a real external repository.

The sandbox deliberately lives outside the Seamward monorepo. It installs extracted, versioned collector artifacts from `vendor/` and runs without workspace links.

## What it demonstrates

The `Candidate ATS` integration contains four independently matched operations:

| Operation                     | Route                         | Business result   |
| ----------------------------- | ----------------------------- | ----------------- |
| `candidate.create`            | `/webhooks/candidates`        | Candidate created |
| `candidate.update`            | `/webhooks/candidates`        | Candidate updated |
| `candidate.status_changed`    | `/webhooks/candidates/status` | Status updated    |
| `candidate.document_uploaded` | `/webhooks/documents`         | Document attached |

The repository contains three immutable OpenAPI versions:

| Version                     | Intended lifecycle | Purpose                                                |
| --------------------------- | ------------------ | ------------------------------------------------------ |
| `candidate-ats-v1`          | Initial active     | Original four-operation baseline                       |
| `candidate-ats-v2`          | Compatible draft   | Adds optional `source_system` metadata                 |
| `candidate-ats-v3-breaking` | Breaking draft     | Renames `email_address` to `candidate_email` on create |

Only one version is active at a time. Each version contains several operation contracts. Registering a draft does not change analysis until that version is explicitly activated.

Controlled scenarios include:

- healthy create, update, status, and document operations;
- provider field rename;
- provider primitive type change;
- silent HTTP success without a business outcome;
- authentication failure;
- median latency shift traffic;
- correlated retry-rate anomaly traffic;
- contract promotion and rollback.

## Requirements

- Node.js 22 or newer
- pnpm 11.19.0
- a Seamward workspace and integration
- a Source key, Integration key, and server-side ingest token
- a workspace API key with `contracts:read`, `contracts:write`, and `contracts:activate`

## Install

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

Fill the placeholders in your local `.env`. Never commit that file. Set `SEAMWARD_COMMIT_SHA` to `git rev-parse HEAD` so evidence and GitHub delivery refer to the same source revision.

Start the service:

```bash
pnpm dev
```

The default address is `http://127.0.0.1:4200`. The collector sends privacy-safe envelope v0.2 observations to `https://api.seamward.com/ingest` unless configured otherwise.

The same service can run in Docker without copying `.env` into the image:

```bash
docker compose up --build
```

## Register the contract versions

Create a scoped API key in Seamward, set `SEAMWARD_API_KEY` and `SEAMWARD_INTEGRATION_ID`, then run:

```bash
pnpm contract:bootstrap
```

This command idempotently registers all three versions. If the integration has no active version, it activates `candidate-ats-v1`. It never replaces an existing active version implicitly.

Inspect the lifecycle:

```bash
pnpm contract:list
```

Register one version explicitly:

```bash
pnpm contract:register -- candidate-ats-v2
```

Promote a draft:

```bash
pnpm contract:activate -- candidate-ats-v2
```

Roll back by reactivating a superseded immutable version:

```bash
pnpm contract:activate -- candidate-ats-v1
```

The activation command reads the active version first and sends it as an optimistic concurrency precondition.

## Send operation traffic

```bash
pnpm send:healthy
pnpm send:update
pnpm send:status
pnpm send:document
```

Each observation carries a deterministic operation identity, payload location, attempt number, deployment context, and privacy-safe correlation namespace.

## Trigger structural and outcome failures

Provider field rename:

```bash
pnpm send:rename
```

The provider sends `candidate_email` instead of `email_address`. The consumer still returns HTTP `202`, but it does not persist the candidate or emit the expected `candidate` business outcome. This creates structural evidence against v1 and can also expire an expected-outcome rule.

Silent success:

```bash
pnpm send:silent
```

Recommended outcome rule:

```text
When candidate.create is observed, a candidate must appear within 1 minute.
```

Recover a failed candidate using the printed ID:

```bash
pnpm send:recovery -- cand_123
```

Reset local state:

```bash
pnpm reset
```

## Generate behavioural evidence

Seamward compares the current 15-minute window with the preceding 24-hour baseline. Establish at least 30 healthy samples:

```bash
pnpm send:baseline
```

Allow those observations to leave the current 15-minute window before generating a current anomaly.

Latency shift:

```bash
pnpm send:latency
```

This sends 30 operations with a deterministic 175 ms processing delay.

Retry anomaly:

```bash
pnpm send:retries
```

This sends 30 correlated logical operations. Ten receive a second attempt, producing a 33.3 percent retry rate without exposing the idempotency values.

## Preflight

With the service running and all local credentials configured:

```bash
pnpm preflight
```

The check verifies:

- the sandbox health endpoint;
- bounded collector counters;
- public Contract API access;
- an active contract version;
- at least four active operations.

It never prints credentials.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```

Tests prove operation matching, contract-version differences, retry correlation, envelope v0.2 metadata, outcome behavior, and that candidate values do not leave the process.

## Collector prerelease

This repository vendors `@seamward/collector@0.1.0-alpha.2` and `@seamward/contracts@0.1.0-alpha.2`, built from the official Seamward monorepo. Tarballs and checksums are retained in `vendor/` until the public npm distribution is available.

The alpha collector is for evaluation and demonstration, not a production support commitment.

## Founder demo

Follow `DEMO_RUNBOOK.md` for the exact contract lifecycle, traffic sequence, expected UI states, repair approval, GitHub delivery, and reset procedure.
