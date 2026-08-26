import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Candidate ATS OpenAPI document", () => {
  it("describes the four webhook operations exposed by the service", () => {
    const document = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "contracts/candidate-ats-v1.openapi.json"),
        "utf8",
      ),
    ) as { webhooks?: Record<string, unknown> };

    expect(Object.keys(document.webhooks ?? {}).sort()).toEqual([
      "candidate.create",
      "candidate.document_uploaded",
      "candidate.status_changed",
      "candidate.update",
    ]);
  });
});
