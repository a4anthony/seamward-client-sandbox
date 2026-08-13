import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("provider authentication failures", () => {
  it("preserves the failed response and records a rejected outcome", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());
    harness.failures.set("auth-failure");

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/candidates",
      payload: candidatePayload("healthy", "cand_auth"),
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ received: false, persisted: false });

    await harness.collector.flush();
    expect(harness.envelopes[0]).toMatchObject({
      transport: { statusCode: 401 },
      outcome: { accepted: false },
    });
  });
});
