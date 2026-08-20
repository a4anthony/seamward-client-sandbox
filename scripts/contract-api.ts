import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { firstScriptArgument } from "./arguments.js";

interface ContractVersion {
  id: string;
  declaredVersion: string;
  lifecycleStatus: "draft" | "active" | "superseded";
  operations: Array<{ operationKey: string }>;
}

interface ContractRegistration {
  id: string;
  declaredVersion: string;
  lifecycleStatus: "draft" | "active" | "superseded";
  operationCount: number;
}

export interface ContractList {
  activeContractVersionId: string | null;
  contracts: ContractVersion[];
}

interface ContractManifest {
  contracts: Array<{
    declaredVersion: string;
    file: string;
    purpose: string;
  }>;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function apiUrl(path: string): string {
  const base =
    process.env.SEAMWARD_MANAGEMENT_API_URL ?? "https://api.seamward.com";
  return `${base.replace(/\/$/, "")}${path}`;
}

async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      authorization: `Bearer ${required("SEAMWARD_API_KEY")}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

function contractsPath(): string {
  return `/v1/integrations/${encodeURIComponent(required("SEAMWARD_INTEGRATION_ID"))}/contracts`;
}

async function responseJson(
  response: Response,
): Promise<Record<string, unknown>> {
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      `Seamward API returned ${response.status}: ${String(body.error ?? "unknown_error")}`,
    );
  }
  return body;
}

export async function listContracts(): Promise<ContractList> {
  return (await responseJson(
    await apiRequest(contractsPath()),
  )) as unknown as ContractList;
}

async function manifest(): Promise<ContractManifest> {
  return JSON.parse(
    await readFile(resolve(process.cwd(), "contracts/manifest.json"), "utf8"),
  ) as ContractManifest;
}

export async function registerContract(
  declaredVersion: string,
): Promise<ContractRegistration> {
  const entry = (await manifest()).contracts.find(
    (candidate) => candidate.declaredVersion === declaredVersion,
  );
  if (!entry) throw new Error(`Unknown contract version: ${declaredVersion}`);
  const document = JSON.parse(
    await readFile(resolve(process.cwd(), "contracts", entry.file), "utf8"),
  ) as Record<string, unknown>;
  const response = await apiRequest(contractsPath(), {
    method: "POST",
    body: JSON.stringify({ declaredVersion, format: "openapi", document }),
  });
  if (response.status === 409) {
    const existing = (await listContracts()).contracts.find(
      (contract) => contract.declaredVersion === declaredVersion,
    );
    if (existing) {
      return {
        id: existing.id,
        declaredVersion: existing.declaredVersion,
        lifecycleStatus: existing.lifecycleStatus,
        operationCount: existing.operations.length,
      };
    }
  }
  const body = await responseJson(response);
  const registered = body.contract as ContractRegistration | undefined;
  if (!registered)
    throw new Error("Seamward API did not return the registered contract");
  return registered;
}

export async function activateContract(
  declaredVersion: string,
  requestedReason?: "promote" | "rollback",
) {
  const current = await listContracts();
  const target = current.contracts.find(
    (contract) => contract.declaredVersion === declaredVersion,
  );
  if (!target)
    throw new Error(`Register ${declaredVersion} before activating it`);
  if (target.id === current.activeContractVersionId) {
    return {
      activeContractVersionId: target.id,
      previousActiveContractVersionId: target.id,
      unchanged: true,
    };
  }
  const reason =
    requestedReason ??
    (target.lifecycleStatus === "superseded" ? "rollback" : "promote");
  return responseJson(
    await apiRequest(
      `${contractsPath()}/${encodeURIComponent(target.id)}/activate`,
      {
        method: "POST",
        body: JSON.stringify({
          expectedActiveContractVersionId: current.activeContractVersionId,
          reason,
        }),
      },
    ),
  );
}

export function requestedVersion(): string {
  const version = firstScriptArgument(process.argv.slice(2));
  if (!version) throw new Error("Pass a declared contract version");
  return version;
}

export async function contractManifest(): Promise<ContractManifest> {
  return manifest();
}
