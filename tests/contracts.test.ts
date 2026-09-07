import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readContract(file: string): {
  paths?: Record<string, unknown>;
  webhooks?: Record<string, unknown>;
} {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "contracts", file), "utf8"),
  ) as {
    paths?: Record<string, unknown>;
    webhooks?: Record<string, unknown>;
  };
}

describe("sandbox OpenAPI documents", () => {
  it("describes the four webhook operations exposed by the service", () => {
    const document = readContract("candidate-ats-v1.openapi.json");

    expect(Object.keys(document.webhooks ?? {}).sort()).toEqual([
      "candidate.create",
      "candidate.document_uploaded",
      "candidate.status_changed",
      "candidate.update",
    ]);
  });

  it("describes the three payment notification webhooks", () => {
    const document = readContract("payment-notifications-v1.openapi.json");

    expect(Object.keys(document.webhooks ?? {}).sort()).toEqual([
      "payment.failed",
      "payment.refunded",
      "payment.succeeded",
    ]);
  });

  it("describes the outbound customer notification API", () => {
    const document = readContract("customer-notifications-v1.openapi.json");

    expect(Object.keys(document.paths ?? {})).toEqual(["/v1/messages"]);
  });
});
