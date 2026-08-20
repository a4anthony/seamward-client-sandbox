import { z } from "zod";
import { normalizeRouteTemplate } from "./operation-identity.js";
const shapeSchema = z.lazy(() => z.union([
    z.object({ kind: z.literal("null") }).strict(),
    z.object({ kind: z.literal("boolean") }).strict(),
    z.object({ kind: z.literal("number") }).strict(),
    z.object({ kind: z.literal("string") }).strict(),
    z
        .object({ kind: z.literal("array"), items: z.array(shapeSchema) })
        .strict(),
    z
        .object({ kind: z.literal("object"), fields: z.record(shapeSchema) })
        .strict(),
]));
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
export const LEGACY_ENVELOPE_VERSION = "0.1";
export const ENVELOPE_VERSION = "0.2";
export const directionSchema = z.enum(["inbound", "outbound"]);
export const protocolSchema = z.enum([
    "http-webhook",
    "http-api",
    "scheduled-feed",
    "queue",
]);
export const correlationSchema = z
    .object({
    traceId: z.string().min(1).optional(),
    sourceEventIdHash: z.string().min(1).optional(),
    idempotencyKeyHash: z.string().min(1).optional(),
    hashNamespace: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
        .optional(),
})
    .strict();
export const payloadLocationSchema = z.enum(["request", "response", "message"]);
export const transportSchema = z
    .object({
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    routeTemplate: z.string().min(1),
    /** Optional only for backward compatibility with envelope v0.1 collectors. */
    payloadLocation: payloadLocationSchema.optional(),
    statusCode: z.number().int().min(0).max(599),
    durationMs: z.number().nonnegative(),
    attempt: z.number().int().positive(),
})
    .strict();
export const payloadMetaSchema = z
    .object({
    /** "none" = body dropped collector-side (the default posture). */
    storage: z.enum(["none", "encrypted-object"]),
    schemaFingerprint: z.string().startsWith("sha256:"),
    /**
     * Structural shape of the raw payload - field names + types, never
     * values. Required: the server compares this against declared contracts;
     * the fingerprint alone is irreversible and cannot be diffed.
     */
    schemaShape: shapeSchema,
    redactionPolicyVersion: z.string().min(1),
    /** Present only when storage = "encrypted-object". */
    objectRef: z.string().min(1).optional(),
})
    .strict()
    .refine((p) => (p.storage === "encrypted-object") === (p.objectRef !== undefined), {
    message: "objectRef must be present iff storage is encrypted-object",
});
export const outcomeSchema = z
    .object({
    accepted: z.boolean(),
    businessObjectType: z.string().min(1).optional(),
    businessObjectIdHash: z.string().min(1).optional(),
})
    .strict();
const deploymentLabelSchema = z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+~-]*$/);
export const deploymentContextSchema = z
    .object({
    /** Stable application/service identifier; never a user or customer ID. */
    service: deploymentLabelSchema.optional(),
    /** Release tag, build ID, or shortened commit selected by the collector. */
    release: deploymentLabelSchema.optional(),
    /** Full or abbreviated Git commit SHA. */
    commitSha: z
        .string()
        .regex(/^[a-fA-F0-9]{7,64}$/)
        .optional(),
})
    .strict()
    .refine((context) => Object.values(context).some((value) => value !== undefined), {
    message: "deployment context must contain at least one value",
});
export const observationEnvelopeSchema = z
    .object({
    envelopeVersion: z.enum([LEGACY_ENVELOPE_VERSION, ENVELOPE_VERSION]),
    eventId: z.string().startsWith("evt_"),
    tenantId: z.string().startsWith("ten_"),
    environmentId: z.string().startsWith("env_"),
    // A connected collector sends the public key. Ingest replaces it with the
    // internal ID before persistence; legacy collectors still send int_ IDs.
    integrationId: z.string().regex(/^(?:int_|sw_int_)[A-Za-z0-9_-]+$/),
    direction: directionSchema,
    protocol: protocolSchema,
    occurredAt: z.string().datetime(),
    /** Present on new collectors; absent v0.1 envelopes use legacy identity rules. */
    operationIdentityVersion: z.literal("1").optional(),
    deployment: deploymentContextSchema.optional(),
    /**
     * Provider event label used for sequence analysis (for example,
     * "candidate.completed"). It must be low-cardinality metadata, never a
     * customer or business-object identifier.
     */
    eventType: z
        .string()
        .min(1)
        .max(128)
        .regex(/^[A-Za-z0-9._:-]+$/)
        .optional(),
    correlation: correlationSchema,
    contract: z
        .object({
        declaredVersion: z.string().min(1).optional(),
        observedFingerprint: z.string().startsWith("sha256:"),
    })
        .strict(),
    transport: transportSchema,
    payload: payloadMetaSchema,
    outcome: outcomeSchema,
})
    .strict()
    .superRefine((envelope, context) => {
    const versionedIdentity = envelope.envelopeVersion === ENVELOPE_VERSION;
    if (!versionedIdentity)
        return;
    if (envelope.operationIdentityVersion !== "1") {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["operationIdentityVersion"],
            message: "operation identity version is required for envelope v0.2",
        });
    }
    if (!envelope.transport.payloadLocation) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["transport", "payloadLocation"],
            message: "payload location is required for versioned operation identity",
        });
    }
    if (envelope.transport.attempt > 2_147_483_647) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["transport", "attempt"],
            message: "attempt exceeds the supported integer range",
        });
    }
    try {
        normalizeRouteTemplate(envelope.transport.routeTemplate, envelope.protocol);
    }
    catch (error) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["transport", "routeTemplate"],
            message: error instanceof Error ? error.message : "invalid operation target",
        });
    }
    const keyedHashes = [
        envelope.correlation.sourceEventIdHash,
        envelope.correlation.idempotencyKeyHash,
        envelope.outcome.businessObjectIdHash,
    ].filter((value) => value !== undefined);
    if (keyedHashes.length > 0 && !envelope.correlation.hashNamespace) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["correlation", "hashNamespace"],
            message: "hash namespace is required for keyed hashes",
        });
    }
    for (const hash of keyedHashes) {
        if (!/^sha256:[0-9a-f]{64}$/.test(hash)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["correlation"],
                message: "keyed hashes must use canonical sha256 format",
            });
        }
    }
});
/** Parse an unknown value into an envelope, throwing on any violation. */
export function parseEnvelope(input) {
    return observationEnvelopeSchema.parse(input);
}
/** Safe variant returning a discriminated result instead of throwing. */
export function safeParseEnvelope(input) {
    return observationEnvelopeSchema.safeParse(input);
}
//# sourceMappingURL=envelope.js.map