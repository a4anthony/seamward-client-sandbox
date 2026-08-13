import { send, setFailureMode } from "./script-client.js";

const sourceEventId = process.argv[2];
if (!sourceEventId) throw new Error("Pass the candidate ID from the silent-failure run");
await setFailureMode("none");
await send("healthy", sourceEventId);
