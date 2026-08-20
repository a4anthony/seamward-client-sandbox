import { afterEach, describe, expect, it, vi } from "vitest";
import { activateContract, registerContract } from "../scripts/contract-api.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function configure() {
  vi.stubEnv("SEAMWARD_MANAGEMENT_API_URL", "https://api.example.test");
  vi.stubEnv("SEAMWARD_API_KEY", "sw_api_test_key");
  vi.stubEnv("SEAMWARD_INTEGRATION_ID", "int_demo");
}

describe("public Contract API tooling", () => {
  it("registers a complete OpenAPI version as a draft", async () => {
    configure();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      return Response.json(
        {
          contract: {
            id: "contract_v1",
            declaredVersion: "candidate-ats-v1",
            lifecycleStatus: "draft",
            operationCount: 4,
          },
        },
        { status: 201 },
      );
    });

    const registered = await registerContract("candidate-ats-v1");
    expect(registered).toMatchObject({
      declaredVersion: "candidate-ats-v1",
      lifecycleStatus: "draft",
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe(
      "https://api.example.test/v1/integrations/int_demo/contracts",
    );
    const body = JSON.parse(String(requests[0]?.init?.body)) as {
      format: string;
      document: { webhooks: Record<string, unknown> };
    };
    expect(body.format).toBe("openapi");
    expect(Object.keys(body.document.webhooks)).toHaveLength(4);
  });

  it("activates with the current version as an optimistic precondition", async () => {
    configure();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      requests.push({ url, init });
      if (!init?.method) {
        return Response.json({
          activeContractVersionId: "contract_v1",
          contracts: [
            {
              id: "contract_v1",
              declaredVersion: "candidate-ats-v1",
              lifecycleStatus: "active",
              operations: [{ operationKey: "candidateCreated:message" }],
            },
            {
              id: "contract_v2",
              declaredVersion: "candidate-ats-v2",
              lifecycleStatus: "draft",
              operations: [{ operationKey: "candidateCreated:message" }],
            },
          ],
        });
      }
      return Response.json({
        activationId: "activation_v2",
        activeContractVersionId: "contract_v2",
        previousActiveContractVersionId: "contract_v1",
        revision: 2,
      });
    });

    await activateContract("candidate-ats-v2");
    expect(requests).toHaveLength(2);
    expect(requests[1]?.url).toContain("/contract_v2/activate");
    expect(JSON.parse(String(requests[1]?.init?.body))).toEqual({
      expectedActiveContractVersionId: "contract_v1",
      reason: "promote",
    });
  });
});
