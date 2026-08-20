import { registerContract, requestedVersion } from "./contract-api.js";

const contract = await registerContract(requestedVersion());
console.log(
  JSON.stringify(
    {
      id: contract.id,
      declaredVersion: contract.declaredVersion,
      lifecycleStatus: contract.lifecycleStatus,
      operationCount: contract.operationCount,
    },
    null,
    2,
  ),
);
