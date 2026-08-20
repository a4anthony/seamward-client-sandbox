import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  compareShapeToSchema,
  importOpenApiOperations,
  resolveContractOperation,
  shapeOf,
} from "@seamward/contracts";
import { describe, expect, it } from "vitest";
import {
  candidatePayload,
  type CandidateOperation,
} from "../src/provider-simulator.js";

const versions = [
  "candidate-ats-v1.openapi.json",
  "candidate-ats-v2.openapi.json",
  "candidate-ats-v3-breaking.openapi.json",
] as const;

function contract(file: (typeof versions)[number]) {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "contracts", file), "utf8"),
  ) as Record<string, unknown>;
}

function operations(file: (typeof versions)[number]) {
  return importOpenApiOperations(contract(file), {
    direction: "inbound",
    protocol: "http-webhook",
  });
}

function observation(operation: CandidateOperation) {
  return {
    direction: "inbound",
    protocol: "http-webhook",
    method: "POST",
    routeTemplate:
      operation === "candidate.status_changed"
        ? "/webhooks/candidates/status"
        : operation === "candidate.document_uploaded"
          ? "/webhooks/documents"
          : "/webhooks/candidates",
    eventType: operation,
    statusCode: 202,
    payloadLocation: "message" as const,
  };
}

describe("versioned multi-operation contracts", () => {
  it.each(versions)("imports four deterministic operations from %s", (file) => {
    const imported = operations(file);
    expect(imported).toHaveLength(4);
    expect(
      new Set(imported.map((operation) => operation.operationKey)).size,
    ).toBe(4);
  });

  it.each([
    "candidate.create",
    "candidate.update",
    "candidate.status_changed",
    "candidate.document_uploaded",
  ] as const)(
    "matches healthy %s traffic to exactly one v1 operation",
    (eventType) => {
      const decision = resolveContractOperation(
        operations("candidate-ats-v1.openapi.json"),
        observation(eventType),
      );
      expect(decision.kind).toBe("matched");
      if (decision.kind !== "matched") return;
      expect(
        compareShapeToSchema(
          shapeOf(candidatePayload({ operation: eventType })),
          decision.operation.schema,
        ),
      ).toEqual([]);
    },
  );

  it("proves the breaking v3 create schema rejects the v1 email field", () => {
    const decision = resolveContractOperation(
      operations("candidate-ats-v3-breaking.openapi.json"),
      observation("candidate.create"),
    );
    expect(decision.kind).toBe("matched");
    if (decision.kind !== "matched") return;
    const findings = compareShapeToSchema(
      shapeOf(candidatePayload({ operation: "candidate.create" })),
      decision.operation.schema,
    );
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "missing-required-field",
          path: "$.candidate_email",
        }),
        expect.objectContaining({
          kind: "unexpected-field",
          path: "$.email_address",
        }),
      ]),
    );
  });
});
