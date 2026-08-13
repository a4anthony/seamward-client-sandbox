import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("silent-success failure", () => {
  it("returns success without producing the expected candidate outcome", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());
    harness.failures.set("silent-success");

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/candidates",
      payload: candidatePayload("healthy", "cand_missing"),
    });
    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ received: true, persisted: false });
    expect(harness.candidates.get("cand_missing")).toBeNull();

    await harness.collector.flush();
    expect(harness.envelopes).toHaveLength(1);
    expect(harness.envelopes[0]).toMatchObject({
      eventType: "candidate.create",
      outcome: { accepted: true },
    });
    expect(harness.envelopes[0]?.outcome.businessObjectType).toBeUndefined();
    expect(harness.envelopes[0]?.outcome.businessObjectIdHash).toBeUndefined();
  });
});
