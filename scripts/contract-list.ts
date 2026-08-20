import { listContracts } from "./contract-api.js";

const result = await listContracts();
console.log(
  JSON.stringify(
    {
      activeContractVersionId: result.activeContractVersionId,
      contracts: result.contracts.map((contract) => ({
        id: contract.id,
        declaredVersion: contract.declaredVersion,
        lifecycleStatus: contract.lifecycleStatus,
        operationCount: contract.operations.length,
      })),
    },
    null,
    2,
  ),
);
