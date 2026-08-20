import type { ConnectedCollector } from "@seamward/collector";
import type { Json } from "@seamward/contracts";
import Fastify from "fastify";
import { CandidateStore, type Candidate } from "./candidate-store.js";
import {
  FailureControls,
  isFailureMode,
  type FailureMode,
} from "./failure-controls.js";

type CandidateEventType =
  | "candidate.create"
  | "candidate.update"
  | "candidate.status_changed"
  | "candidate.document_uploaded";

type WebhookResult = {
  statusCode: number;
  eventType?: CandidateEventType;
  correlation: { sourceEventId: string; idempotencyKey: string };
  outcome: {
    accepted: boolean;
    businessObjectType?: string;
    businessObjectId?: string;
  };
};

function record(payload: Json): Record<string, Json> | null {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, Json>)
    : null;
}

function text(value: Json | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function eventIdentity(payload: Json): {
  eventId: string;
  eventType: CandidateEventType | null;
  candidateId: string | null;
} {
  const value = record(payload);
  const eventType = text(value?.event_type);
  return {
    eventId: text(value?.event_id) ?? "invalid-event",
    eventType: [
      "candidate.create",
      "candidate.update",
      "candidate.status_changed",
      "candidate.document_uploaded",
    ].includes(eventType ?? "")
      ? (eventType as CandidateEventType)
      : null,
    candidateId: text(value?.id),
  };
}

function hasRenamedCandidateEmail(payload: Json): boolean {
  const value = record(payload);
  return Boolean(
    value &&
    value.event_type === "candidate.create" &&
    typeof value.candidate_email === "string" &&
    value.email_address === undefined,
  );
}

function accepted(
  eventType: CandidateEventType,
  eventId: string,
  businessObjectType: string,
): WebhookResult {
  return {
    statusCode: 202,
    eventType,
    correlation: { sourceEventId: eventId, idempotencyKey: eventId },
    outcome: {
      accepted: true,
      businessObjectType,
      businessObjectId: eventId,
    },
  };
}

function rejected(eventId: string, statusCode: number): WebhookResult {
  return {
    statusCode,
    correlation: { sourceEventId: eventId, idempotencyKey: eventId },
    outcome: { accepted: false },
  };
}

function providerAttempt(value: unknown): 1 | 2 {
  return value === "2" ? 2 : 1;
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

  async function handleCandidate(payload: Json): Promise<WebhookResult> {
    const value = record(payload);
    const { eventId, eventType, candidateId } = eventIdentity(payload);

    if (failures.current() === "slow-processing") {
      await new Promise((resolve) => setTimeout(resolve, 175));
    }
    if (failures.current() === "auth-failure") return rejected(eventId, 401);
    if (!value || !eventType || !candidateId) return rejected(eventId, 422);
    if (hasRenamedCandidateEmail(payload)) {
      return {
        ...accepted("candidate.create", eventId, "candidate"),
        outcome: { accepted: true },
      };
    }
    if (failures.current() === "silent-success") {
      return {
        ...accepted(eventType, eventId, "candidate"),
        outcome: { accepted: true },
      };
    }

    const now = new Date().toISOString();
    if (eventType === "candidate.create") {
      const emailAddress = text(value.email_address);
      const fullName = text(value.full_name);
      const externalReference = text(value.external_reference);
      if (!emailAddress || !fullName || !externalReference)
        return rejected(eventId, 422);
      const candidate: Candidate = {
        id: candidateId,
        emailAddress,
        fullName,
        externalReference,
        status: "new",
        documentCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      candidates.save(candidate);
      return accepted(eventType, eventId, "candidate");
    }

    if (eventType === "candidate.update") {
      const emailAddress = text(value.email_address);
      const fullName = text(value.full_name);
      if (!emailAddress || !fullName) return rejected(eventId, 422);
      if (!candidates.update(candidateId, { emailAddress, fullName }, now)) {
        return rejected(eventId, 404);
      }
      return accepted(eventType, eventId, "candidate");
    }

    if (eventType === "candidate.status_changed") {
      const status = text(value.status);
      if (
        !status ||
        !["new", "screening", "interview", "hired", "rejected"].includes(status)
      ) {
        return rejected(eventId, 422);
      }
      if (
        !candidates.update(
          candidateId,
          { status: status as Candidate["status"] },
          now,
        )
      ) {
        return rejected(eventId, 404);
      }
      return accepted(eventType, eventId, "candidate");
    }

    if (!text(value.document_id) || !text(value.document_type)) {
      return rejected(eventId, 422);
    }
    if (!candidates.addDocument(candidateId, now))
      return rejected(eventId, 404);
    return accepted(eventType, eventId, "candidate_document");
  }

  function observedHandlers(routeTemplate: string) {
    return {
      first: collector.observeWebhook(
        { integrationKey, routeTemplate, attempt: 1 },
        handleCandidate,
      ),
      retry: collector.observeWebhook(
        { integrationKey, routeTemplate, attempt: 2 },
        handleCandidate,
      ),
    };
  }

  const candidateHandlers = observedHandlers("/webhooks/candidates");
  const statusHandlers = observedHandlers("/webhooks/candidates/status");
  const documentHandlers = observedHandlers("/webhooks/documents");

  app.get("/health", async () => ({
    status: "ok",
    collector: collector.stats(),
  }));

  app.get<{ Params: { id: string } }>(
    "/candidates/:id",
    async (request, reply) => {
      const candidate = candidates.get(request.params.id);
      if (!candidate)
        return reply.code(404).send({ error: "candidate_not_found" });
      return candidate;
    },
  );

  async function dispatch(
    request: { body: unknown; headers: Record<string, unknown> },
    reply: { code(statusCode: number): { send(value: unknown): unknown } },
    handlers: ReturnType<typeof observedHandlers>,
  ) {
    const attempt = providerAttempt(request.headers["x-provider-attempt"]);
    const result = await (attempt === 2 ? handlers.retry : handlers.first)(
      request.body as Json,
    );
    const { candidateId } = eventIdentity(request.body as Json);
    return reply.code(result.statusCode).send({
      received: result.statusCode < 400,
      persisted: Boolean(candidateId && candidates.get(candidateId)),
    });
  }

  app.post("/webhooks/candidates", async (request, reply) =>
    dispatch(request, reply, candidateHandlers),
  );
  app.post("/webhooks/candidates/status", async (request, reply) =>
    dispatch(request, reply, statusHandlers),
  );
  app.post("/webhooks/documents", async (request, reply) =>
    dispatch(request, reply, documentHandlers),
  );

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
