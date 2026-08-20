import { send, setFailureMode } from "./script-client.js";

const candidateId = `cand_status_${Date.now()}`;
await setFailureMode("none");
await send("healthy", candidateId, "candidate.create", 1, false);
await send("healthy", candidateId, "candidate.status_changed");
