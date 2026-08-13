import { buildCandidateApp } from "./app.js";
import { createConfiguredCollector } from "./relayguard.js";

const { collector, integrationKey } = createConfiguredCollector();
const { app } = buildCandidateApp({
  collector,
  integrationKey,
  enableTestControls: process.env.ENABLE_TEST_CONTROLS === "true",
});

const port = Number(process.env.PORT ?? 4100);
await app.listen({ host: "127.0.0.1", port });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void app.close().finally(() => process.exit(0));
  });
}

console.log(`RelayGuard client sandbox listening on http://127.0.0.1:${port}`);
