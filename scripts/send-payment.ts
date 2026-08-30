const baseUrl = process.env.SANDBOX_URL ?? "http://127.0.0.1:4200";

const response = await fetch(`${baseUrl}/webhooks/payments`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id: `evt_payment_${Date.now()}`,
    event_type: "payment.succeeded",
    payment_id: `pay_${Date.now()}`,
    amount: 4_200,
    currency: "GBP",
  }),
});

console.log(
  JSON.stringify(
    { statusCode: response.status, body: await response.json() },
    null,
    2,
  ),
);

if (!response.ok) process.exitCode = 1;
