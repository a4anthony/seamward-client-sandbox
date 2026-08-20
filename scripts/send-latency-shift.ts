import { send, setFailureMode } from "./script-client.js";

await setFailureMode("slow-processing");
const batchId = Date.now();
for (let index = 0; index < 30; index += 1) {
  await send(
    "healthy",
    `cand_latency_${batchId}_${index}`,
    "candidate.create",
    1,
    false,
  );
}
await setFailureMode("none");
console.log(
  JSON.stringify(
    { scenario: "latency-shift", observations: 30, processingDelayMs: 175 },
    null,
    2,
  ),
);
