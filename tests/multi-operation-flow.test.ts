import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("multi-operation candidate lifecycle", () => {
  it("handles create, update, status, and document operations", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());
    const id = "cand_lifecycle";
    const cases = [
      ["/webhooks/candidates", "candidate.create"],
      ["/webhooks/candidates", "candidate.update"],
      ["/webhooks/candidates/status", "candidate.status_changed"],
      ["/webhooks/documents", "candidate.document_uploaded"],
    ] as const;

    for (const [url, operation] of cases) {
      const response = await harness.app.inject({
        method: "POST",
        url,
        payload: candidatePayload({ operation, id }),
      });
      expect(response.statusCode).toBe(202);
    }

    expect(harness.candidates.get(id)).toMatchObject({
      fullName: "Taylor Updated",
      status: "screening",
      documentCount: 1,
    });
  });

  it("accepts a repeated provider attempt idempotently", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());
    const payload = candidatePayload({ id: "cand_retry" });
    for (const attempt of [1, 2]) {
      await harness.app.inject({
        method: "POST",
        url: "/webhooks/candidates",
        headers: { "x-provider-attempt": String(attempt) },
        payload,
      });
    }
    expect(harness.candidates.get("cand_retry")).not.toBeNull();
  });
});
