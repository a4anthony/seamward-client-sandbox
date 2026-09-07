import { afterEach, describe, expect, it, vi } from "vitest";
import { sendCustomerNotification } from "../src/customer-notifications.js";

afterEach(async () => {
  vi.unstubAllGlobals();
});

describe("customer notifications", () => {
  it("sends a notification through the outbound provider API", async () => {
    const providerFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message_id: "msg_1" }), {
        status: 202,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", providerFetch);

    const response = await sendCustomerNotification(
      "https://notifications.example.test",
      {
        customer_id: "customer_1",
        channel: "email",
        template: "payment-receipt",
      },
    );

    expect(response).toEqual({ accepted: true, messageId: "msg_1" });
    expect(providerFetch).toHaveBeenCalledWith(
      "https://notifications.example.test/v1/messages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces a provider rejection without reporting success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    const response = await sendCustomerNotification(
      "https://notifications.example.test",
      {
        customer_id: "customer_2",
        channel: "sms",
        template: "payment-failed",
      },
    );

    expect(response).toEqual({ accepted: false, statusCode: 503 });
  });
});
