import type { ConnectedCollector } from "@relayguard/collector";
import type { Json } from "@relayguard/contracts";
import Fastify from "fastify";
import { CandidateStore } from "./candidate-store.js";
import {
  FailureControls,
  isFailureMode,
  type FailureMode,
} from "./failure-controls.js";

interface CandidateWebhook {
  event_id: string;
  event_type: "candidate.create";
  id: string;
  full_name: string;
  email_address: string;
  external_reference: string;
}

function readCandidate(payload: Json): CandidateWebhook | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const value = payload as Record<string, Json>;
  if (
    typeof value.event_id !== "string" ||
    value.event_type !== "candidate.create" ||
    typeof value.id !== "string" ||
    typeof value.full_name !== "string" ||
    typeof value.email_address !== "string" ||
    typeof value.external_reference !== "string"
  ) {
    return null;
  }
  return value as unknown as CandidateWebhook;
}

export interface BuildCandidateAppOptions {
  collector: ConnectedCollector;
  integrationKey: string;
  enableTestControls?: boolean;
  initialFailureMode?: FailureMode;
}

export function buildCandidateApp({
  collector,
  integrationKey,
  enableTestControls = false,
  initialFailureMode = "none",
}: BuildCandidateAppOptions) {
  const app = Fastify({ logger: false });
  const candidates = new CandidateStore();
  const failures = new FailureControls(initialFailureMode);

  const handleCandidate = collector.observeWebhook(
    { integrationKey, routeTemplate: "/webhooks/candidates" },
    async (payload) => {
      const event = readCandidate(payload);
      const sourceEventId = event?.event_id ?? "invalid-event";

      if (failures.current() === "auth-failure") {
        return {
          statusCode: 401,
          eventType: "candidate.create",
          correlation: { sourceEventId },
          outcome: { accepted: false },
        };
      }

      if (!event) {
        return {
          statusCode: 422,
          eventType: "candidate.create",
          correlation: { sourceEventId },
          outcome: { accepted: false },
        };
      }

      if (failures.current() === "silent-success") {
        return {
          statusCode: 202,
          eventType: event.event_type,
          correlation: { sourceEventId: event.event_id },
          outcome: { accepted: true },
        };
      }

      candidates.save({
        id: event.id,
        emailAddress: event.email_address,
        fullName: event.full_name,
        externalReference: event.external_reference,
        createdAt: new Date().toISOString(),
      });
      return {
        statusCode: 202,
        eventType: event.event_type,
        correlation: { sourceEventId: event.event_id },
        outcome: {
          accepted: true,
          businessObjectType: "candidate",
          businessObjectId: event.event_id,
        },
      };
    },
  );

  app.get("/health", async () => ({ status: "ok" }));

  app.get<{ Params: { id: string } }>("/candidates/:id", async (request, reply) => {
    const candidate = candidates.get(request.params.id);
    if (!candidate) return reply.code(404).send({ error: "candidate_not_found" });
    return candidate;
  });

  app.post("/webhooks/candidates", async (request, reply) => {
    const result = await handleCandidate(request.body as Json);
    const statusCode = result?.statusCode ?? 200;
    return reply.code(statusCode).send({
      received: statusCode < 400,
      persisted: Boolean(
        request.body &&
          typeof request.body === "object" &&
          "id" in request.body &&
          candidates.get(String(request.body.id)),
      ),
    });
  });

  if (enableTestControls) {
    app.post("/test/failure-mode", async (request, reply) => {
      const body = request.body as { mode?: unknown } | null;
      if (!isFailureMode(body?.mode)) {
        return reply.code(400).send({ error: "invalid_failure_mode" });
      }
      failures.set(body.mode);
      return { mode: failures.current() };
    });

    app.post("/test/reset", async () => {
      failures.set("none");
      candidates.clear();
      return { reset: true };
    });
  }

  app.addHook("onClose", async () => {
    await collector.stop();
  });

  return { app, candidates, failures };
}
