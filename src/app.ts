import Fastify from "fastify";
import { registerCandidateWebhooks } from "./candidate-ats-webhooks.js";
import { CandidateStore, type Candidate } from "./candidate-store.js";
import {
  FailureControls,
  isFailureMode,
  type FailureMode,
} from "./failure-controls.js";
import type { Json } from "./json.js";
import {
  PaymentStore,
  registerPaymentWebhooks,
} from "./payment-notifications-webhooks.js";

type CandidateEventType =
  | "candidate.create"
  | "candidate.update"
  | "candidate.status_changed"
  | "candidate.document_uploaded";

type WebhookResult = {
  statusCode: number;
  accepted: boolean;
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
  eventType: CandidateEventType | null;
  candidateId: string | null;
} {
  const value = record(payload);
  const eventType = text(value?.event_type);
  return {
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

function accepted(): WebhookResult {
  return { statusCode: 202, accepted: true };
}

function rejected(statusCode: number): WebhookResult {
  return { statusCode, accepted: false };
}

export interface BuildCandidateAppOptions {
  enableTestControls?: boolean;
  initialFailureMode?: FailureMode;
}

export function buildCandidateApp({
  enableTestControls = false,
  initialFailureMode = "none",
}: BuildCandidateAppOptions = {}) {
  const app = Fastify({ logger: false });
  const candidates = new CandidateStore();
  const payments = new PaymentStore();
  const failures = new FailureControls(initialFailureMode);

  async function handleCandidate(payload: Json): Promise<WebhookResult> {
    const value = record(payload);
    const { eventType, candidateId } = eventIdentity(payload);

    if (failures.current() === "slow-processing") {
      await new Promise((resolve) => setTimeout(resolve, 175));
    }
    if (failures.current() === "auth-failure") return rejected(401);
    if (!value || !eventType || !candidateId) return rejected(422);
    if (failures.current() === "silent-success") return accepted();

    const now = new Date().toISOString();
    if (eventType === "candidate.create") {
      const emailAddress = text(value.email_address);
      const fullName = text(value.full_name);
      const externalReference = text(value.external_reference);
      if (!emailAddress || !fullName || !externalReference) return rejected(422);
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
      return accepted();
    }

    if (eventType === "candidate.update") {
      const emailAddress = text(value.email_address);
      const fullName = text(value.full_name);
      if (!emailAddress || !fullName) return rejected(422);
      if (!candidates.update(candidateId, { emailAddress, fullName }, now)) {
        return rejected(404);
      }
      return accepted();
    }

    if (eventType === "candidate.status_changed") {
      const status = text(value.status);
      if (
        !status ||
        !["new", "screening", "interview", "hired", "rejected"].includes(status)
      ) {
        return rejected(422);
      }
      if (
        !candidates.update(
          candidateId,
          { status: status as Candidate["status"] },
          now,
        )
      ) {
        return rejected(404);
      }
      return accepted();
    }

    if (!text(value.document_id) || !text(value.document_type)) {
      return rejected(422);
    }
    if (!candidates.addDocument(candidateId, now)) return rejected(404);
    return accepted();
  }

  app.get("/health", async () => ({ status: "ok" }));

  app.get<{ Params: { id: string } }>(
    "/candidates/:id",
    async (request, reply) => {
      const candidate = candidates.get(request.params.id);
      if (!candidate) return reply.code(404).send({ error: "candidate_not_found" });
      return candidate;
    },
  );

  registerCandidateWebhooks(app, async (payload) => {
    const result = await handleCandidate(payload);
    const { candidateId } = eventIdentity(payload);
    return {
      statusCode: result.statusCode,
      received: result.accepted,
      persisted: Boolean(candidateId && candidates.get(candidateId)),
    };
  });
  registerPaymentWebhooks(app, payments);

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
      payments.clear();
      return { reset: true };
    });
  }

  return { app, candidates, payments, failures };
}
