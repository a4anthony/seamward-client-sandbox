# Seamward Client Sandbox

A standalone, production-shaped ATS webhook consumer for demonstrating Seamward onboarding, privacy-safe observation, expected outcomes, incident evidence, repair validation, and GitHub delivery.

This repository deliberately lives outside the Seamward monorepo. It installs extracted, versioned Seamward collector artifacts from `vendor/` and can run its tests and CI without local workspace links.

## What it models

The service accepts `candidate.create` webhooks and persists candidates. Seamward observes the request structure, bounded outcome metadata, and deployment context without receiving raw candidate values.

The sandbox supports five deterministic scenarios:

- healthy candidate creation;
- a silent-success defect that returns `202` without storing the candidate;
- a provider field rename that still returns HTTP `202` without persisting the candidate;
- a provider primitive type change;
- an authentication failure.

## Requirements

- Node.js 22 or newer
- pnpm 11.19.0
- a Seamward workspace
- a Seamward Source key, Integration key, and server-side ingest token

## Install

```bash
pnpm install
cp .env.example .env
```

Replace the three Seamward credential placeholders in `.env` with values from your workspace integration. Set `SEAMWARD_COMMIT_SHA` to the current Git commit so incident evidence and GitHub delivery refer to the same source. The ingest token is secret and must remain server-side.

Start the service:

```bash
pnpm dev
```

The default address is `http://127.0.0.1:4200`. The example configuration sends redacted observations to the live Seamward ingest endpoint at `https://api.seamward.com/ingest`.

## Send traffic

Healthy event:

```bash
pnpm send:healthy
```

Provider field rename:

```bash
pnpm send:rename
```

The provider sends `candidate_email` instead of `email_address`. The consumer still returns HTTP `202`, but it does not persist the candidate and it emits no `candidate` business outcome. This is the recommended founder-demo failure because it produces both structural drift and a missing expected outcome while ordinary status-code monitoring sees success.

Silent-success event:

```bash
pnpm send:silent
```

The silent command returns HTTP `202`, but the candidate is not persisted and no `candidate` business outcome is emitted. Use this Seamward rule for either silent-success scenario:

```text
When candidate.create is observed, a candidate must appear within 1 minute.
```

reconciliation should open one missing-business-outcome incident after the delay.

To recover, pass the candidate ID from the field-rename or silent-failure run:

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

This sandbox installs vendored `@seamward/collector@0.1.0-alpha.1` and `@seamward/contracts@0.1.0-alpha.1` packages built from the official Seamward monorepo. Their source tarballs and checksums are retained in `vendor/`. This is a temporary distribution path until the Seamward npm organization scope is available.

The alpha collector is for local evaluation only and is not a production support commitment.

## Founder demo

Follow `DEMO_RUNBOOK.md` for the live Seamward and GitHub preflight, exact terminal commands, expected output, recording order, and reset procedure.
