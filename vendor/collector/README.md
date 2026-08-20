# Seamward Node collector

The Seamward collector observes third-party API and webhook behaviour from a
Node.js backend. It batches redacted evidence asynchronously and never sits on
the application's critical request path.

This `0.1.0-alpha.2` release is for pilot evaluation with Node.js 22 or newer.
TypeScript and server-side JavaScript are supported. PHP, Go, browser, and edge
runtime collectors are not shipped yet.

## 1. Create the Seamward connection

In Seamward:

1. Open the workspace and create an application environment under **Settings**.
2. Generate its ingest token and copy it immediately. The token is shown once.
3. Create or open an integration.
4. Copy the Source key and Integration key shown by Seamward.

The Source and Integration keys are identifiers. The ingest token is a
write-only secret: keep it in the backend secret manager and never put it in
browser code, Git, logs, screenshots, or support messages.

## 2. Install the pilot release

```bash
pnpm add @seamward/collector
```

or `npm install @seamward/collector`. This is a prerelease; pin the version
through your lockfile as with any dependency.

## 3. Configure the backend

```ini
SEAMWARD_SOURCE_KEY=sw_src_replace_me
SEAMWARD_INTEGRATION_KEY=sw_int_replace_me
SEAMWARD_INGEST_TOKEN=sw_ing_replace_me
SEAMWARD_INGEST_URL=http://127.0.0.1:4100/ingest
```

`SEAMWARD_INGEST_URL` is needed for local or self-hosted Seamward. The
collector otherwise uses `https://api.seamward.com/ingest`.

Create one collector per backend process:

```ts
import { createSeamwardCollector } from "@seamward/collector";

export const seamward = createSeamwardCollector({
  sourceKey: process.env.SEAMWARD_SOURCE_KEY!,
  ingestToken: process.env.SEAMWARD_INGEST_TOKEN!,
  endpoint: process.env.SEAMWARD_INGEST_URL,
  deployment: {
    service: "candidate-api",
    release: process.env.RELEASE_VERSION,
    commitSha: process.env.GITHUB_SHA,
  },
});
```

Release and commit metadata are optional. The collector also recognises
`SEAMWARD_COMMIT_SHA`, `VERCEL_GIT_COMMIT_SHA`, `RENDER_GIT_COMMIT`,
`RAILWAY_GIT_COMMIT_SHA`, and `GITHUB_SHA`. Invalid values are ignored instead
of breaking the host application.

## 4. Observe an inbound webhook

Wrap the existing business handler; do not send the inbound request headers to
Seamward.

```ts
const handleCandidateWebhook = seamward.observeWebhook(
  {
    integrationKey: process.env.SEAMWARD_INTEGRATION_KEY!,
    routeTemplate: "/webhooks/candidates",
  },
  async (payload) => {
    const candidate = await candidateService.accept(payload);

    return {
      statusCode: 202,
      eventType: "candidate.create",
      outcome: {
        accepted: true,
        businessObjectType: "candidate",
        businessObjectId: candidate.id,
      },
      correlation: { sourceEventId: candidate.providerEventId },
    };
  },
);

fastify.post("/webhooks/candidates", async (request, reply) => {
  const result = await handleCandidateWebhook(request.body as Record<string, unknown>);
  return reply.code(result.statusCode ?? 200).send();
});
```

Use stable route templates such as `/webhooks/candidates`, never concrete IDs,
query strings, email addresses, or other high-cardinality values.

## 5. Observe an outbound API call

```ts
const providerFetch = seamward.observeFetch({
  integrationKey: process.env.SEAMWARD_INTEGRATION_KEY!,
  routeTemplate: "/v1/candidates",
  eventType: "candidate.create",
});

const response = await providerFetch("https://provider.example/v1/candidates", {
  method: "POST",
  headers: {
    authorization: `Bearer ${process.env.PROVIDER_TOKEN}`,
    "content-type": "application/json",
  },
  body: JSON.stringify(candidate),
});
```

The collector never receives the request headers. It clones successful or
failed responses and inspects JSON asynchronously, so consuming the original
response is not delayed.

## 6. Redaction and correlation

Payload values and headers are never included in the observation envelope. The
collector derives only the structural shape (`string`, `number`, object fields,
and so on) and its fingerprint before the envelope leaves the process. Field
names remain visible because they are required for contract-drift detection.

The default policy identifies these common secret-bearing fields:

```text
password, access_token, refresh_token, authorization, cookie, set-cookie
```

Give an application-specific policy version so evidence can be traced to the
configuration that produced it:

```ts
const seamward = createSeamwardCollector({
  sourceKey: process.env.SEAMWARD_SOURCE_KEY!,
  ingestToken: process.env.SEAMWARD_INGEST_TOKEN!,
  policy: {
    version: "candidate-api-v1",
    dropFields: [
      "password",
      "access_token",
      "refresh_token",
      "authorization",
      "cookie",
      "set-cookie",
      "full_name",
      "email",
      "phone_number",
    ],
    hashFields: [],
  },
});
```

Do not place identifiers in `eventType`, `routeTemplate`, release labels, or
service names. Put only identifiers needed for reconciliation into
`correlation.sourceEventId`, `correlation.idempotencyKey`, or
`outcome.businessObjectId`. The collector converts those values to keyed
SHA-256 hashes locally; Seamward receives no original identifier.

Set `attempt` and a stable `correlation.idempotencyKey` when observing provider
retries. Envelope v0.2 derives a deterministic operation identity and includes
the payload location, canonical attempt number, and a privacy-safe hash
namespace for behavioural analysis.

## 7. Shutdown and health

Flush before a controlled process shutdown:

```ts
process.once("SIGTERM", async () => {
  await seamward.stop();
  process.exit(0);
});
```

`stop()` clears the timer and attempts one final flush. `flush()` and `stop()`
never reject because Seamward telemetry must not break the host application.
Inspect bounded operational counters without logging observations or tokens:

```ts
const {
  enqueued,
  shipped,
  dropped,
  failedBatches,
  queueLength,
  buildErrors,
} = seamward.stats();
```

Defaults:

- flush interval: 5 seconds;
- batch size: 50 observations;
- in-memory queue: 1,000 observations;
- overflow policy: drop oldest and increment `dropped`;
- failed request policy: retain the batch and retry on the next flush;
- application errors: preserve the application's original error behaviour.

## 8. Verify the connection

1. Start the backend with the three Seamward values configured.
2. Exercise one synthetic webhook or API request.
3. Wait for the five-second automatic flush, or call `await seamward.flush()`.
4. Return to the integration in Seamward and select **Check for observation**.
5. Confirm the first observation time and deployment metadata.

If the integration remains unobserved:

- confirm the collector is running in the backend rather than the browser;
- confirm the Source and Integration keys belong to the same workspace;
- confirm the ingest token belongs to the selected application environment;
- inspect `seamward.stats()` for `failedBatches`, `dropped`, or `buildErrors`;
- verify the local API is reachable at the configured ingest URL;
- generate a new ingest token if the original was not saved or may be exposed.

Do not disable redaction or log request bodies to troubleshoot the connection.
