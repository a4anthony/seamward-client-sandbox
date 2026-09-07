import { afterEach, describe, expect, it } from "vitest";
import { candidatePayload } from "../src/provider-simulator.js";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("provider schema changes", () => {
  it("rejects a renamed provider field until the application is updated", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/candidates",
      payload: candidatePayload("field-rename", "cand_renamed"),
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ received: false, persisted: false });
    expect(harness.candidates.get("cand_renamed")).toBeNull();
  });

  it("rejects an incompatible primitive type", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/candidates",
      payload: candidatePayload("type-change", "cand_type_change"),
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ received: false, persisted: false });
  });
});
