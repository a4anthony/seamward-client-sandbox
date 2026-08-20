import { listContracts } from "./contract-api.js";

const requiredVariables = [
  "SEAMWARD_CONNECTION_KEY",
  "SEAMWARD_INGEST_TOKEN",
  "SEAMWARD_API_KEY",
] as const;
const missing = requiredVariables.filter((name) => !process.env[name]);
if (missing.length > 0)
  throw new Error(`Missing required variables: ${missing.join(", ")}`);

const sandboxUrl = process.env.SANDBOX_URL ?? "http://127.0.0.1:4200";
const healthResponse = await fetch(`${sandboxUrl}/health`);
if (!healthResponse.ok)
  throw new Error(`Sandbox health check failed: ${healthResponse.status}`);
const health = (await healthResponse.json()) as {
  status?: string;
  collector?: {
    failedBatches?: number;
    dropped?: number;
    buildErrors?: number;
  };
};
if (health.status !== "ok")
  throw new Error("Sandbox health response is invalid");

const contracts = await listContracts();
const active = contracts.contracts.find(
  (contract) => contract.id === contracts.activeContractVersionId,
);
if (!active) throw new Error("No active contract version is configured");
if (active.operations.length < 4) {
  throw new Error(
    `Active contract has ${active.operations.length} operations; expected at least 4`,
  );
}

console.log(
  JSON.stringify(
    {
      sandbox: "reachable",
      collector: health.collector,
      activeContract: active.declaredVersion,
      operationCount: active.operations.length,
    },
    null,
    2,
  ),
);
