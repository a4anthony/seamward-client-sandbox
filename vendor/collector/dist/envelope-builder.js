import { randomUUID } from "node:crypto";
import { ENVELOPE_VERSION, parseEnvelope, schemaFingerprint, shapeOf, } from "@seamward/contracts";
import { keyedHash } from "./redact.js";
export function buildEnvelope(input, policy, deps = {}) {
    const now = deps.now ?? (() => new Date());
    const newId = deps.newId ?? (() => randomUUID().replaceAll("-", ""));
    const fingerprint = schemaFingerprint(input.payload ?? null);
    const correlation = {};
    if (input.correlation?.traceId)
        correlation.traceId = input.correlation.traceId;
    if (input.correlation?.sourceEventId) {
        correlation.sourceEventIdHash = keyedHash(input.correlation.sourceEventId, policy.hashKey);
    }
    if (input.correlation?.idempotencyKey) {
        correlation.idempotencyKeyHash = keyedHash(input.correlation.idempotencyKey, policy.hashKey);
    }
    const outcome = input.outcome
        ? {
            accepted: input.outcome.accepted,
            ...(input.outcome.businessObjectType
                ? { businessObjectType: input.outcome.businessObjectType }
                : {}),
            ...(input.outcome.businessObjectId
                ? { businessObjectIdHash: keyedHash(input.outcome.businessObjectId, policy.hashKey) }
                : {}),
        }
        : { accepted: input.statusCode < 400 };
    return parseEnvelope({
        envelopeVersion: ENVELOPE_VERSION,
        eventId: `evt_${newId()}`,
        tenantId: input.tenantId,
        environmentId: input.environmentId,
        integrationId: input.integrationId,
        direction: input.direction,
        protocol: input.protocol,
        occurredAt: now().toISOString(),
        ...(input.deployment ? { deployment: input.deployment } : {}),
        ...(input.eventType ? { eventType: input.eventType } : {}),
        correlation,
        contract: {
            ...(input.declaredContractVersion ? { declaredVersion: input.declaredContractVersion } : {}),
            observedFingerprint: fingerprint,
        },
        transport: {
            method: input.method,
            routeTemplate: input.routeTemplate,
            statusCode: input.statusCode,
            durationMs: input.durationMs,
            attempt: input.attempt ?? 1,
        },
        payload: {
            storage: "none",
            schemaFingerprint: fingerprint,
            schemaShape: shapeOf(input.payload ?? null),
            redactionPolicyVersion: policy.version,
        },
        outcome,
    });
}
//# sourceMappingURL=envelope-builder.js.map