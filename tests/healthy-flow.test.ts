import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("healthy candidate ingestion", () => {
  it("persists the candidate and emits a bounded business outcome", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());
    const payload = candidatePayload("healthy", "cand_healthy");

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/candidates",
      payload,
    });
    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ received: true, persisted: true });
    expect(harness.candidates.get("cand_healthy")).toMatchObject({
      emailAddress: "taylor@example.test",
      externalReference: "ATS-1001",
    });

    await harness.collector.flush();
    expect(harness.envelopes).toHaveLength(1);
    expect(harness.envelopes[0]).toMatchObject({
      eventType: "candidate.create",
      deployment: {
        service: "candidate-api",
        release: "test-release",
      },
      outcome: {
        accepted: true,
        businessObjectType: "candidate",
      },
    });
    expect(harness.envelopes[0]?.correlation?.sourceEventIdHash).toMatch(/^sha256:/);
    expect(harness.envelopes[0]?.outcome.businessObjectIdHash).toBe(
      harness.envelopes[0]?.correlation?.sourceEventIdHash,
    );

    const serialised = JSON.stringify(harness.envelopes);
    expect(serialised).not.toContain("Taylor Example");
    expect(serialised).not.toContain("taylor@example.test");
    expect(serialised).not.toContain("cand_healthy");
    expect(serialised).not.toContain("ATS-1001");
  });
});
