import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("multi-operation candidate lifecycle", () => {
  it("records create, update, status, and document operations separately", async () => {
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

    await harness.collector.flush();
    expect(harness.envelopes.map((item) => item.eventType)).toEqual(
      cases.map(([, operation]) => operation),
    );
    expect(
      harness.envelopes.every((item) => item.envelopeVersion === "0.2"),
    ).toBe(true);
    expect(
      harness.envelopes.every(
        (item) =>
          item.operationIdentityVersion === "1" &&
          item.transport.payloadLocation === "message",
      ),
    ).toBe(true);
  });

  it("correlates a second provider attempt without exposing its idempotency key", async () => {
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
    await harness.collector.flush();

    expect(harness.envelopes.map((item) => item.transport.attempt)).toEqual([
      1, 2,
    ]);
    expect(harness.envelopes[0]?.correlation.idempotencyKeyHash).toBe(
      harness.envelopes[1]?.correlation.idempotencyKeyHash,
    );
    expect(harness.envelopes[0]?.correlation.hashNamespace).toBeDefined();
    expect(JSON.stringify(harness.envelopes)).not.toContain("cand_retry");
  });
});
