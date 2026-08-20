import { send, setFailureMode } from "./script-client.js";

await setFailureMode("none");
const batchId = Date.now();
for (let index = 0; index < 30; index += 1) {
  await send(
    "healthy",
    `cand_baseline_${batchId}_${index}`,
    "candidate.create",
    1,
    false,
  );
}
console.log(
  JSON.stringify(
    { scenario: "behavioural-baseline", observations: 30 },
    null,
    2,
  ),
);
