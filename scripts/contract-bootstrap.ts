import {
  activateContract,
  contractManifest,
  listContracts,
  registerContract,
} from "./contract-api.js";

const entries = (await contractManifest()).contracts;
for (const entry of entries) await registerContract(entry.declaredVersion);

const current = await listContracts();
if (!current.activeContractVersionId) {
  await activateContract(entries[0]!.declaredVersion, "promote");
}

const final = await listContracts();
console.log(
  JSON.stringify(
    {
      activeContractVersionId: final.activeContractVersionId,
      contracts: final.contracts.map((contract) => ({
        declaredVersion: contract.declaredVersion,
        lifecycleStatus: contract.lifecycleStatus,
        operationCount: contract.operations.length,
      })),
    },
    null,
    2,
  ),
);
