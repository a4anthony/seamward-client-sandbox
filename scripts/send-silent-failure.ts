import { send, setFailureMode } from "./script-client.js";

await setFailureMode("silent-success");
await send("healthy");
