import { createServer } from "node:http";
import { sendCustomerNotification } from "../src/customer-notifications.js";

const provider = createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/v1/messages") {
    response.writeHead(404).end();
    return;
  }

  request.resume();
  request.on("end", () => {
    response.writeHead(202, { "content-type": "application/json" });
    response.end(JSON.stringify({ message_id: `msg_${Date.now()}` }));
  });
});

await new Promise<void>((resolve, reject) => {
  provider.once("error", reject);
  provider.listen(0, "127.0.0.1", resolve);
});

try {
  const address = provider.address();
  if (!address || typeof address === "string") {
    throw new Error("Notification provider did not expose a TCP port");
  }

  const result = await sendCustomerNotification(
    `http://127.0.0.1:${address.port}`,
    {
      customer_id: `customer_${Date.now()}`,
      channel: "email",
      template: "payment-receipt",
    },
  );
  console.log(JSON.stringify(result, null, 2));
  if (!result.accepted) process.exitCode = 1;
} finally {
  await new Promise<void>((resolve, reject) => {
    provider.close((error) => (error ? reject(error) : resolve()));
  });
}
