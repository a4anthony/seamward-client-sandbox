import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("provider schema changes", () => {
  it("acknowledges a renamed provider field while exposing the missing business outcome", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/candidates",
      payload: candidatePayload("field-rename", "cand_renamed"),
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ received: true, persisted: false });
    expect(harness.candidates.get("cand_renamed")).toBeNull();

    await harness.collector.flush();
    expect(harness.envelopes).toHaveLength(1);
    expect(harness.envelopes[0]).toMatchObject({
      eventType: "candidate.create",
      outcome: { accepted: true },
    });
    expect(harness.envelopes[0]?.outcome.businessObjectType).toBeUndefined();
    expect(harness.envelopes[0]?.outcome.businessObjectIdHash).toBeUndefined();

    const serialised = JSON.stringify(harness.envelopes);
    expect(serialised).toContain("candidate_email");
    expect(serialised).not.toContain("taylor@example.test");
    expect(serialised).not.toContain("cand_renamed");
  });

  it("emits distinct structural fingerprints without transmitting field values", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());

    const healthy = candidatePayload("healthy", "cand_shape_1");
    const renamed = candidatePayload("field-rename", "cand_shape_2");
    const changedType = candidatePayload("type-change", "cand_shape_3");

    for (const payload of [healthy, renamed, changedType]) {
      await harness.app.inject({ method: "POST", url: "/webhooks/candidates", payload });
    }
    await harness.collector.flush();

    expect(new Set(harness.envelopes.map((event) => event.contract.observedFingerprint)).size).toBe(3);
    expect(JSON.stringify(harness.envelopes)).not.toContain("example.test");
  });
});
