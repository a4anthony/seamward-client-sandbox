import { activateContract, requestedVersion } from "./contract-api.js";

console.log(
  JSON.stringify(await activateContract(requestedVersion()), null, 2),
);
