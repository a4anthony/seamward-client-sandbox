export type NotificationChannel = "email" | "sms";

export interface CustomerNotification {
  customer_id: string;
  channel: NotificationChannel;
  template: string;
}

export type CustomerNotificationResult =
  | { accepted: true; messageId: string }
  | { accepted: false; statusCode: number };

export async function sendCustomerNotification(
  providerUrl: string,
  notification: CustomerNotification,
): Promise<CustomerNotificationResult> {
  const response = await fetch(`${providerUrl}/v1/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    return { accepted: false, statusCode: response.status };
  }

  const body = (await response.json()) as { message_id?: unknown };
  if (typeof body.message_id !== "string") {
    return { accepted: false, statusCode: 502 };
  }

  return { accepted: true, messageId: body.message_id };
}
