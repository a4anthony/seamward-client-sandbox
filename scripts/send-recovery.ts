import { send, setFailureMode } from "./script-client.js";
import { firstScriptArgument } from "./arguments.js";

const sourceEventId = firstScriptArgument(process.argv.slice(2));
if (!sourceEventId) throw new Error("Pass the candidate ID from the silent-failure run");
await setFailureMode("none");
await send("healthy", sourceEventId);
