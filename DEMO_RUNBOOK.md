# Founder demo runbook

This runbook produces one honest evidence chain from a synthetic provider change to a real GitHub issue. It uses a local Candidate API, the live Seamward control plane, and a repository mapped through the Seamward GitHub App.

## Safety boundaries

- Use synthetic candidate data only.
- Never show `.env`, the PHPStorm run configuration, ingest tokens, or GitHub credentials.
- Do not log request bodies or headers.
- Rehearse GitHub delivery only up to the confirmation dialog. The final confirmation creates a real external issue.
- Seamward proposes and validates a bounded repair. A human approves it. Seamward does not merge or deploy code.

## Live Seamward preflight

1. Open `https://seamward.com` and sign in to the demo workspace.
2. Create or open the `Candidate ATS` integration.
3. Configure the expected outcome: `When candidate.create is observed, a candidate must appear within 1 minute.`
4. Confirm the Source key and Integration key match the local `.env` file.
5. Confirm the application environment ingest token is current.
6. Connect the production Seamward GitHub App.
7. Map the integration to this repository and its default branch.
8. Confirm the GitHub installation has Issues read and write permission.
9. If demonstrating a draft pull request, also confirm Contents and Pull requests read and write permission.

## Local preflight

Install and verify the repository:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
```

Set `SEAMWARD_COMMIT_SHA` in `.env` to the output of:

```bash
git rev-parse HEAD
```

Start the Candidate API in the first PHPStorm terminal:

```bash
pnpm dev
```

Run the following commands from a second PHPStorm terminal.

## Recording sequence

Reset the deterministic state:

```bash
pnpm reset
```

Establish a healthy baseline:

```bash
pnpm send:healthy
```

The result must contain:

```json
{
  "statusCode": 202,
  "body": {
    "received": true,
    "persisted": true
  }
}
```

Trigger the provider field rename:

```bash
pnpm send:rename
```

The result must contain:

```json
{
  "statusCode": 202,
  "body": {
    "received": true,
    "persisted": false
  }
}
```

Copy the printed `candidateId` for recovery. Return to Seamward, check for the new observation, and allow the one-minute expected-outcome window to elapse. Open the resulting incident and keep the same incident through evidence, replay, repair approval, and GitHub delivery.

Use this approval rationale:

```text
Historical replay passes for the candidate field mapping, and the change is limited to the observed renamed field.
```

Review the generated issue preview. During the final take only, select `Create GitHub issue`, confirm the repository and content, and open the returned GitHub link.

## Recovery and retakes

Recover the failed candidate with the ID printed by `pnpm send:rename`:

```bash
pnpm send:recovery -- cand_123
```

Reset before a new local take:

```bash
pnpm reset
```

Each new failure creates distinct evidence. Avoid creating multiple public GitHub issues during rehearsals.
