import { type DeploymentContext, type Json, type ObservationEnvelope } from "@seamward/contracts";
import { type RedactionPolicy } from "./redact.js";
/**
 * Builds a valid ObservationEnvelope from one observed request/response.
 *
 * Privacy order of operations (the load-bearing design):
 * 1. The structural fingerprint is computed from the RAW payload - signatures
 *    are shape-only (field names + types, never values), so this is safe and
 *    keeps drift detection faithful to what the provider actually sent, even
 *    for fields the policy would drop from any stored content.
 * 2. Correlation identifiers leave the process only as keyed hashes.
 * 3. The envelope schema is strict and has NO field for headers or bodies:
 *    a leak would require changing @seamward/contracts, not a builder bug.
 *
 * Pure: clock and id generation are injected for determinism. The built
 * envelope is validated through the strict schema before it is returned.
 */
export interface ObservationInput {
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    routeTemplate: string;
    payloadLocation?: "request" | "response" | "message";
    statusCode: number;
    durationMs: number;
    attempt?: number;
    /** Low-cardinality provider event label; never put identifiers or PII here. */
    eventType?: string;
    /** Raw payload - used for shape-only fingerprinting; never shipped. */
    payload?: Json;
    declaredContractVersion?: string;
    deployment?: DeploymentContext;
    correlation?: {
        traceId?: string;
        sourceEventId?: string;
        idempotencyKey?: string;
    };
    outcome?: {
        accepted: boolean;
        businessObjectType?: string;
        businessObjectId?: string;
    };
}
export interface BuilderDeps {
    now?: () => Date;
    newId?: () => string;
}
export declare function buildEnvelope(input: ObservationInput, policy: RedactionPolicy, deps?: BuilderDeps): ObservationEnvelope;
