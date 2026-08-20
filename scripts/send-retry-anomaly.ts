import { send, setFailureMode } from "./script-client.js";

await setFailureMode("none");
const batchId = Date.now();
let observations = 0;
for (let index = 0; index < 30; index += 1) {
  const candidateId = `cand_retry_${batchId}_${index}`;
  await send("healthy", candidateId, "candidate.create", 1, false);
  observations += 1;
  if (index < 10) {
    await send("healthy", candidateId, "candidate.create", 2, false);
    observations += 1;
  }
}
console.log(
  JSON.stringify(
    {
      scenario: "retry-anomaly",
      logicalOperations: 30,
      retriedOperations: 10,
      observations,
    },
    null,
    2,
  ),
);
