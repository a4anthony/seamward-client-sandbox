import { send, setFailureMode } from "./script-client.js";

const candidateId = `cand_document_${Date.now()}`;
await setFailureMode("none");
await send("healthy", candidateId, "candidate.create", 1, false);
await send("healthy", candidateId, "candidate.document_uploaded");
