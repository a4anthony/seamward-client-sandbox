import type { FastifyInstance } from "fastify";
import type { Json } from "./json.js";

export interface CandidateWebhookResult {
  statusCode: number;
  received: boolean;
  persisted: boolean;
}

export type CandidateWebhookHandler = (
  payload: Json,
) => Promise<CandidateWebhookResult>;

export function registerCandidateWebhooks(
  app: FastifyInstance,
  handleWebhook: CandidateWebhookHandler,
): void {
  async function dispatch(
    request: { body: unknown },
    reply: { code(statusCode: number): { send(value: unknown): unknown } },
  ) {
    const result = await handleWebhook(request.body as Json);
    return reply.code(result.statusCode).send({
      received: result.received,
      persisted: result.persisted,
    });
  }

  app.post("/webhooks/candidates", dispatch);
  app.post("/webhooks/candidates/status", dispatch);
  app.post("/webhooks/documents", dispatch);
}
