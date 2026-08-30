import type { FastifyInstance } from "fastify";
import type { Json } from "./json.js";

export type PaymentStatus = "succeeded" | "failed" | "refunded";

export interface PaymentRecord {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  updatedAt: string;
}

type PaymentEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded";

function object(value: Json): Record<string, Json> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}

function eventStatus(value: string): PaymentStatus | null {
  const statuses: Record<PaymentEventType, PaymentStatus> = {
    "payment.succeeded": "succeeded",
    "payment.failed": "failed",
    "payment.refunded": "refunded",
  };
  return statuses[value as PaymentEventType] ?? null;
}

export class PaymentStore {
  readonly #payments = new Map<string, PaymentRecord>();

  save(payment: PaymentRecord): void {
    this.#payments.set(payment.id, payment);
  }

  get(id: string): PaymentRecord | null {
    return this.#payments.get(id) ?? null;
  }

  clear(): void {
    this.#payments.clear();
  }
}

export function registerPaymentWebhooks(
  app: FastifyInstance,
  payments: PaymentStore,
): void {
  app.post("/webhooks/payments", async (request, reply) => {
    const payload = object(request.body as Json);
    const paymentId =
      typeof payload?.payment_id === "string" ? payload.payment_id : null;
    const status =
      typeof payload?.event_type === "string"
        ? eventStatus(payload.event_type)
        : null;
    const amount = typeof payload?.amount === "number" ? payload.amount : null;
    const currency =
      typeof payload?.currency === "string" ? payload.currency : null;

    if (!paymentId || !status || amount === null || !currency) {
      return reply.code(422).send({ error: "invalid_payment_notification" });
    }

    payments.save({
      id: paymentId,
      status,
      amount,
      currency,
      updatedAt: new Date().toISOString(),
    });

    return reply.code(202).send({ received: true, paymentId });
  });
}
