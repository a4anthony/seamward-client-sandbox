import { z } from "zod";
import type { Shape } from "./shape.js";
/**
 * The observation envelope - Seamward's spine.
 *
 * Every observation a collector ships uses this shape. The raw payload body is
 * NEVER required: structural fingerprints and hashes support drift detection
 * without transmitting sensitive content. When body capture is explicitly
 * enabled, the envelope references an encrypted object, never inlines it.
 *
 * Versioned deliberately: bump `envelopeVersion` on breaking changes and keep
 * parsers for old versions - collectors in customer environments upgrade slowly.
 */
export declare const LEGACY_ENVELOPE_VERSION: "0.1";
export declare const ENVELOPE_VERSION: "0.2";
export declare const directionSchema: z.ZodEnum<["inbound", "outbound"]>;
export declare const protocolSchema: z.ZodEnum<["http-webhook", "http-api", "scheduled-feed", "queue"]>;
export declare const correlationSchema: z.ZodObject<{
    traceId: z.ZodOptional<z.ZodString>;
    sourceEventIdHash: z.ZodOptional<z.ZodString>;
    idempotencyKeyHash: z.ZodOptional<z.ZodString>;
    hashNamespace: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    traceId?: string | undefined;
    sourceEventIdHash?: string | undefined;
    idempotencyKeyHash?: string | undefined;
    hashNamespace?: string | undefined;
}, {
    traceId?: string | undefined;
    sourceEventIdHash?: string | undefined;
    idempotencyKeyHash?: string | undefined;
    hashNamespace?: string | undefined;
}>;
export declare const payloadLocationSchema: z.ZodEnum<["request", "response", "message"]>;
export declare const transportSchema: z.ZodObject<{
    method: z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>;
    routeTemplate: z.ZodString;
    /** Optional only for backward compatibility with envelope v0.1 collectors. */
    payloadLocation: z.ZodOptional<z.ZodEnum<["request", "response", "message"]>>;
    statusCode: z.ZodNumber;
    durationMs: z.ZodNumber;
    attempt: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    routeTemplate: string;
    statusCode: number;
    durationMs: number;
    attempt: number;
    payloadLocation?: "message" | "request" | "response" | undefined;
}, {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    routeTemplate: string;
    statusCode: number;
    durationMs: number;
    attempt: number;
    payloadLocation?: "message" | "request" | "response" | undefined;
}>;
export declare const payloadMetaSchema: z.ZodEffects<z.ZodObject<{
    /** "none" = body dropped collector-side (the default posture). */
    storage: z.ZodEnum<["none", "encrypted-object"]>;
    schemaFingerprint: z.ZodString;
    /**
     * Structural shape of the raw payload - field names + types, never
     * values. Required: the server compares this against declared contracts;
     * the fingerprint alone is irreversible and cannot be diffed.
     */
    schemaShape: z.ZodType<Shape, z.ZodTypeDef, Shape>;
    redactionPolicyVersion: z.ZodString;
    /** Present only when storage = "encrypted-object". */
    objectRef: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    storage: "none" | "encrypted-object";
    schemaFingerprint: string;
    schemaShape: Shape;
    redactionPolicyVersion: string;
    objectRef?: string | undefined;
}, {
    storage: "none" | "encrypted-object";
    schemaFingerprint: string;
    schemaShape: Shape;
    redactionPolicyVersion: string;
    objectRef?: string | undefined;
}>, {
    storage: "none" | "encrypted-object";
    schemaFingerprint: string;
    schemaShape: Shape;
    redactionPolicyVersion: string;
    objectRef?: string | undefined;
}, {
    storage: "none" | "encrypted-object";
    schemaFingerprint: string;
    schemaShape: Shape;
    redactionPolicyVersion: string;
    objectRef?: string | undefined;
}>;
export declare const outcomeSchema: z.ZodObject<{
    accepted: z.ZodBoolean;
    businessObjectType: z.ZodOptional<z.ZodString>;
    businessObjectIdHash: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    accepted: boolean;
    businessObjectType?: string | undefined;
    businessObjectIdHash?: string | undefined;
}, {
    accepted: boolean;
    businessObjectType?: string | undefined;
    businessObjectIdHash?: string | undefined;
}>;
export declare const deploymentContextSchema: z.ZodEffects<z.ZodObject<{
    /** Stable application/service identifier; never a user or customer ID. */
    service: z.ZodOptional<z.ZodString>;
    /** Release tag, build ID, or shortened commit selected by the collector. */
    release: z.ZodOptional<z.ZodString>;
    /** Full or abbreviated Git commit SHA. */
    commitSha: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    service?: string | undefined;
    release?: string | undefined;
    commitSha?: string | undefined;
}, {
    service?: string | undefined;
    release?: string | undefined;
    commitSha?: string | undefined;
}>, {
    service?: string | undefined;
    release?: string | undefined;
    commitSha?: string | undefined;
}, {
    service?: string | undefined;
    release?: string | undefined;
    commitSha?: string | undefined;
}>;
export type DeploymentContext = z.infer<typeof deploymentContextSchema>;
export declare const observationEnvelopeSchema: z.ZodEffects<z.ZodObject<{
    envelopeVersion: z.ZodEnum<["0.1", "0.2"]>;
    eventId: z.ZodString;
    tenantId: z.ZodString;
    environmentId: z.ZodString;
    integrationId: z.ZodString;
    direction: z.ZodEnum<["inbound", "outbound"]>;
    protocol: z.ZodEnum<["http-webhook", "http-api", "scheduled-feed", "queue"]>;
    occurredAt: z.ZodString;
    /** Present on new collectors; absent v0.1 envelopes use legacy identity rules. */
    operationIdentityVersion: z.ZodOptional<z.ZodLiteral<"1">>;
    deployment: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        /** Stable application/service identifier; never a user or customer ID. */
        service: z.ZodOptional<z.ZodString>;
        /** Release tag, build ID, or shortened commit selected by the collector. */
        release: z.ZodOptional<z.ZodString>;
        /** Full or abbreviated Git commit SHA. */
        commitSha: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    }, {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    }>, {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    }, {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    }>>;
    /**
     * Provider event label used for sequence analysis (for example,
     * "candidate.completed"). It must be low-cardinality metadata, never a
     * customer or business-object identifier.
     */
    eventType: z.ZodOptional<z.ZodString>;
    correlation: z.ZodObject<{
        traceId: z.ZodOptional<z.ZodString>;
        sourceEventIdHash: z.ZodOptional<z.ZodString>;
        idempotencyKeyHash: z.ZodOptional<z.ZodString>;
        hashNamespace: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    }, {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    }>;
    contract: z.ZodObject<{
        declaredVersion: z.ZodOptional<z.ZodString>;
        observedFingerprint: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    }, {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    }>;
    transport: z.ZodObject<{
        method: z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>;
        routeTemplate: z.ZodString;
        /** Optional only for backward compatibility with envelope v0.1 collectors. */
        payloadLocation: z.ZodOptional<z.ZodEnum<["request", "response", "message"]>>;
        statusCode: z.ZodNumber;
        durationMs: z.ZodNumber;
        attempt: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    }, {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    }>;
    payload: z.ZodEffects<z.ZodObject<{
        /** "none" = body dropped collector-side (the default posture). */
        storage: z.ZodEnum<["none", "encrypted-object"]>;
        schemaFingerprint: z.ZodString;
        /**
         * Structural shape of the raw payload - field names + types, never
         * values. Required: the server compares this against declared contracts;
         * the fingerprint alone is irreversible and cannot be diffed.
         */
        schemaShape: z.ZodType<Shape, z.ZodTypeDef, Shape>;
        redactionPolicyVersion: z.ZodString;
        /** Present only when storage = "encrypted-object". */
        objectRef: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    }, {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    }>, {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    }, {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    }>;
    outcome: z.ZodObject<{
        accepted: z.ZodBoolean;
        businessObjectType: z.ZodOptional<z.ZodString>;
        businessObjectIdHash: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    }, {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    envelopeVersion: "0.1" | "0.2";
    eventId: string;
    occurredAt: string;
    correlation: {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    };
    contract: {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    };
    transport: {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    };
    payload: {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    };
    outcome: {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    };
    eventType?: string | undefined;
    operationIdentityVersion?: "1" | undefined;
    deployment?: {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    } | undefined;
}, {
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    envelopeVersion: "0.1" | "0.2";
    eventId: string;
    occurredAt: string;
    correlation: {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    };
    contract: {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    };
    transport: {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    };
    payload: {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    };
    outcome: {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    };
    eventType?: string | undefined;
    operationIdentityVersion?: "1" | undefined;
    deployment?: {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    } | undefined;
}>, {
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    envelopeVersion: "0.1" | "0.2";
    eventId: string;
    occurredAt: string;
    correlation: {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    };
    contract: {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    };
    transport: {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    };
    payload: {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    };
    outcome: {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    };
    eventType?: string | undefined;
    operationIdentityVersion?: "1" | undefined;
    deployment?: {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    } | undefined;
}, {
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    envelopeVersion: "0.1" | "0.2";
    eventId: string;
    occurredAt: string;
    correlation: {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    };
    contract: {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    };
    transport: {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    };
    payload: {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    };
    outcome: {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    };
    eventType?: string | undefined;
    operationIdentityVersion?: "1" | undefined;
    deployment?: {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    } | undefined;
}>;
export type ObservationEnvelope = z.infer<typeof observationEnvelopeSchema>;
/** Parse an unknown value into an envelope, throwing on any violation. */
export declare function parseEnvelope(input: unknown): ObservationEnvelope;
/** Safe variant returning a discriminated result instead of throwing. */
export declare function safeParseEnvelope(input: unknown): z.SafeParseReturnType<{
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    envelopeVersion: "0.1" | "0.2";
    eventId: string;
    occurredAt: string;
    correlation: {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    };
    contract: {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    };
    transport: {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    };
    payload: {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    };
    outcome: {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    };
    eventType?: string | undefined;
    operationIdentityVersion?: "1" | undefined;
    deployment?: {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    } | undefined;
}, {
    tenantId: string;
    environmentId: string;
    integrationId: string;
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
    envelopeVersion: "0.1" | "0.2";
    eventId: string;
    occurredAt: string;
    correlation: {
        traceId?: string | undefined;
        sourceEventIdHash?: string | undefined;
        idempotencyKeyHash?: string | undefined;
        hashNamespace?: string | undefined;
    };
    contract: {
        observedFingerprint: string;
        declaredVersion?: string | undefined;
    };
    transport: {
        method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
        routeTemplate: string;
        statusCode: number;
        durationMs: number;
        attempt: number;
        payloadLocation?: "message" | "request" | "response" | undefined;
    };
    payload: {
        storage: "none" | "encrypted-object";
        schemaFingerprint: string;
        schemaShape: Shape;
        redactionPolicyVersion: string;
        objectRef?: string | undefined;
    };
    outcome: {
        accepted: boolean;
        businessObjectType?: string | undefined;
        businessObjectIdHash?: string | undefined;
    };
    eventType?: string | undefined;
    operationIdentityVersion?: "1" | undefined;
    deployment?: {
        service?: string | undefined;
        release?: string | undefined;
        commitSha?: string | undefined;
    } | undefined;
}>;
