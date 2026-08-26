import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("healthy candidate ingestion", () => {
  it("persists a valid candidate", async () => {
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
  });
});
