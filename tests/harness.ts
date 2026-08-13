import { createRelayGuardCollector } from "@relayguard/collector";
import type { ObservationEnvelope } from "@relayguard/contracts";
import { buildCandidateApp } from "../src/app.js";

const SOURCE_KEY = "rg_src_DemoBackend2026X";
const INTEGRATION_KEY = "rg_int_DemoCandidate2026";
const INGEST_TOKEN = `rg_ing_${"s".repeat(43)}`;

export function createHarness() {
  const envelopes: ObservationEnvelope[] = [];
  const collector = createRelayGuardCollector({
    sourceKey: SOURCE_KEY,
    ingestToken: INGEST_TOKEN,
    endpoint: "http://127.0.0.1:4000/ingest",
    flushIntervalMs: 60_000,
    deployment: {
      service: "relayguard-client-sandbox",
      release: "test-release",
      commitSha: "a84c90f29b18d76565a85a779c8f4f32fb5ea5f7",
    },
    fetchFn: (async (_input, init) => {
      const batch = JSON.parse(String(init?.body)) as { envelopes: ObservationEnvelope[] };
      envelopes.push(...batch.envelopes);
      return new Response(null, { status: 202 });
    }) as typeof fetch,
  });
  const built = buildCandidateApp({
    collector,
    integrationKey: INTEGRATION_KEY,
    enableTestControls: true,
  });
  return { ...built, collector, envelopes };
}
