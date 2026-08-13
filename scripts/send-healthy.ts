import { send, setFailureMode } from "./script-client.js";

await setFailureMode("none");
await send("healthy");
