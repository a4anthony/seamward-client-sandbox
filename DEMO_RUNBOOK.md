# Founder demo runbook

This runbook produces one honest evidence chain from a versioned multi-operation contract to a provider break, an incident, a bounded repair, and GitHub delivery.

## Safety boundaries

- Use synthetic candidate data only.
- Never show `.env`, IDE run configurations, API keys, ingest tokens, or GitHub credentials.
- Do not log request bodies or headers.
- Rehearse GitHub delivery only up to the confirmation dialog. Final confirmation creates a real external issue or draft pull request.
- Seamward proposes and validates a bounded repair. A human approves it. Seamward does not merge or deploy code.

## Live Seamward preflight

1. Sign in to the demo workspace and open `Candidate ATS`.
2. Confirm the application environment and integration use the credentials configured locally.
3. Create a workspace API key with `contracts:read`, `contracts:write`, and `contracts:activate`.
4. Run `pnpm contract:bootstrap`.
5. Open the Contracts tab and confirm:
   - `candidate-ats-v1` is Active;
   - `candidate-ats-v2` is Draft;
   - `candidate-ats-v3-breaking` is Draft;
   - each version contains four operations.
6. Configure the outcome rule: `When candidate.create is observed, a candidate must appear within 1 minute.`
7. Connect the production Seamward GitHub App.
8. Map the integration to this repository and its default branch.
9. Confirm Issues read and write permission. For a draft pull request, also confirm Contents and Pull requests read and write permission.

## Local preflight

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
```

The sandbox reads the current local Git commit automatically. `SEAMWARD_COMMIT_SHA` remains an optional override. Start the service:

```bash
pnpm dev
```

From a second terminal:

```bash
pnpm preflight
pnpm reset
```

## Recording sequence

### 1. Show the active multi-operation contract

Open the Contracts tab. Expand `candidate-ats-v1` and show the four operation keys:

- `candidateCreated:message`
- `candidateUpdated:message`
- `candidateStatusChanged:message`
- `candidateDocumentUploaded:message`

Explain that the version is immutable and only one version is active.

### 2. Send healthy traffic across operations

```bash
pnpm send:healthy
pnpm send:update
pnpm send:status
pnpm send:document
```

Show that each observation resolves to the appropriate operation rather than a single integration-wide JSON shape.

### 3. Demonstrate safe draft registration

Open `candidate-ats-v2`. Explain that it adds optional `source_system` metadata. It remains Draft and does not change analysis.

Activate it from the UI or run:

```bash
pnpm contract:activate -- candidate-ats-v2
```

Show that v2 becomes Active and v1 becomes Previous. If desired, immediately demonstrate rollback:

```bash
pnpm contract:activate -- candidate-ats-v1
```

Return to v1 for the failure sequence below.

### 4. Trigger the provider break

```bash
pnpm send:rename
```

Expected output includes HTTP `202`, `received: true`, and `persisted: false`. Copy the printed candidate ID.

The observation still matches `candidateCreated:message`, but v1 detects the field difference:

- `email_address` was removed;
- `candidate_email` was added;
- no candidate business outcome was produced.

Allow the one-minute outcome window to expire. Open the resulting incident and show the attributed contract version, operation, match decision, observation evidence, and missing outcome.

### 5. Review and deliver the bounded repair

Keep the same incident open through replay, proposal, approval, and delivery. Use this approval rationale:

```text
Historical replay passes for the candidate field mapping, and the change is limited to the observed renamed field.
```

Review the generated issue or draft pull request preview. During the final take only, confirm delivery and open the returned GitHub link.

### 6. Recover and verify

```bash
pnpm send:recovery -- cand_123
```

Explain that GitHub delivery alone does not resolve the incident. Resolution requires repaired traffic from an identified deployment or an independently sustained recovery window.

## Optional behavioural demonstration

Behavioural findings require an established baseline. Send baseline traffic at least 15 minutes before recording:

```bash
pnpm send:baseline
```

Then choose one current-window scenario:

```bash
pnpm send:latency
```

or:

```bash
pnpm send:retries
```

The latency scenario produces 30 delayed observations. The retry scenario produces 30 correlated logical operations with ten retries. Do not claim an immediate finding unless the earlier observations have moved into the baseline window.

## Retakes

Reset before every local retake:

```bash
pnpm reset
```

Each failure creates distinct evidence. Avoid producing multiple public GitHub issues during rehearsals.
