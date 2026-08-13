# RelayGuard Client Sandbox

A standalone, production-shaped ATS webhook consumer for exercising RelayGuard onboarding, observation ingestion, expected outcomes, incidents, repair validation, and GitHub delivery.

This repository deliberately lives outside the RelayGuard monorepo. It installs versioned public collector artifacts and can run its tests and CI without local workspace links.

## What it models

The service accepts `candidate.create` webhooks and persists candidates. RelayGuard observes the request structure, bounded outcome metadata, and deployment context without receiving raw candidate values.

The sandbox supports four deterministic scenarios:

- healthy candidate creation;
- a silent-success defect that returns `202` without storing the candidate;
- a provider field rename;
- a provider primitive type change;
- an authentication failure.

## Requirements

- Node.js 22 or newer
- pnpm 11.19.0
- a running RelayGuard API
- a RelayGuard Source key, Integration key, and server-side ingest token

## Install

```bash
pnpm install
cp .env.example .env
```

Replace the three RelayGuard credential placeholders in `.env` with values from your workspace integration. The ingest token is secret and must remain server-side.

Start the service:

```bash
pnpm dev
```

The default address is `http://127.0.0.1:4200` so it can run beside the local RelayGuard API on port `4100`.

## Send traffic

Healthy event:

```bash
pnpm send:healthy
```

Silent-success event:

```bash
pnpm send:silent
```

The silent command returns HTTP `202`, but the candidate is not persisted and no `candidate` business outcome is emitted. With this RelayGuard rule:

```text
When candidate.create is observed, a candidate must appear within 1 minute.
```

reconciliation should open one missing-business-outcome incident after the delay.

To recover, pass the candidate ID from the silent-failure run:

```bash
pnpm send:recovery -- cand_123
```

Reset local state and failure controls:

```bash
pnpm reset
```

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```

Tests assert that healthy outcomes, silent failures, schema changes, and authentication failures produce the expected bounded envelopes. They also prove that names, email addresses, candidate IDs, and provider reference values do not leave the process.

## Collector prerelease

This sandbox currently installs `@relayguard/collector@0.1.0-alpha.1` and `@relayguard/contracts@0.1.0-alpha.1` from the repository's public prerelease assets. SHA-256 checksums are attached to the release. This is a temporary distribution path until the RelayGuard npm organization scope is available.

The alpha collector is for local evaluation only and is not a production support commitment.
