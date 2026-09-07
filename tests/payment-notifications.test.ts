import { afterEach, describe, expect, it } from "vitest";
import { createHarness } from "./harness.js";

const close: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (close.length > 0) await close.pop()?.();
});

describe("payment notifications", () => {
  it("records a valid payment webhook", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/payments",
      payload: {
        id: "evt_payment_1",
        event_type: "payment.succeeded",
        payment_id: "pay_1",
        amount: 4_200,
        currency: "GBP",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ received: true, paymentId: "pay_1" });
    expect(harness.payments.get("pay_1")).toMatchObject({
      status: "succeeded",
      amount: 4_200,
      currency: "GBP",
    });
  });

  it("rejects an unknown payment event", async () => {
    const harness = createHarness();
    close.push(() => harness.app.close());

    const response = await harness.app.inject({
      method: "POST",
      url: "/webhooks/payments",
      payload: {
        id: "evt_payment_unknown",
        event_type: "payment.unknown",
        payment_id: "pay_unknown",
        amount: 100,
        currency: "GBP",
      },
    });

    expect(response.statusCode).toBe(422);
    expect(harness.payments.get("pay_unknown")).toBeNull();
  });
});
