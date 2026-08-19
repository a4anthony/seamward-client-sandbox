import { z } from "zod";
const endpointSchema = z
    .string()
    .url()
    .max(2048)
    .refine((value) => {
    const url = new URL(value);
    return (url.protocol === "https:" ||
        (url.protocol === "http:" &&
            (url.hostname === "localhost" ||
                url.hostname === "127.0.0.1" ||
                url.hostname === "::1")));
}, "collector endpoint must use HTTPS unless it is local");
export const collectorBootstrapConfigSchema = z
    .object({
    endpoint: endpointSchema,
    credentialId: z.string().regex(/^colcred_[A-Za-z0-9_-]+$/).max(128),
    secret: z.string().min(32).max(256),
    hashKey: z.string().min(32).max(256),
    tenantId: z.string().regex(/^ten_[A-Za-z0-9_-]+$/).max(128),
    environmentId: z.string().regex(/^env_[A-Za-z0-9_-]+$/).max(128),
    integrationId: z.string().regex(/^int_[A-Za-z0-9_-]+$/).max(128),
})
    .strict();
const INTEGRATION_KEY_PREFIX = "sw_int_";
const SOURCE_KEY_PREFIX = "sw_src_";
const integrationKeyTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{16,24}$/);
export const integrationKeySchema = z.string().regex(/^sw_int_[A-Za-z0-9_-]{16,24}$/);
export function formatIntegrationKey(token) {
    return integrationKeySchema.parse(`${INTEGRATION_KEY_PREFIX}${integrationKeyTokenSchema.parse(token)}`);
}
export function parseIntegrationKey(value) {
    return integrationKeySchema.parse(value);
}
export const sourceKeySchema = z.string().regex(/^sw_src_[A-Za-z0-9_-]{16,24}$/);
export function formatSourceKey(token) {
    return sourceKeySchema.parse(`${SOURCE_KEY_PREFIX}${integrationKeyTokenSchema.parse(token)}`);
}
export function parseSourceKey(value) {
    return sourceKeySchema.parse(value);
}
const INGEST_TOKEN_PREFIX = "sw_ing_";
const ingestTokenSecretSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const ingestTokenSchema = z.string().regex(/^sw_ing_[A-Za-z0-9_-]{43}$/);
export function formatIngestToken(secret) {
    return ingestTokenSchema.parse(`${INGEST_TOKEN_PREFIX}${ingestTokenSecretSchema.parse(secret)}`);
}
export function parseIngestToken(value) {
    return ingestTokenSchema.parse(value);
}
const LEGACY_INTEGRATION_PREFIX = "sw_int_";
const LEGACY_INGEST_KEY_PREFIX = "rgik_v1.";
const LEGACY_CONNECTION_PREFIX = "rgc_v1.";
/** Decode connection bundles issued before opaque Integration keys. */
export function parseLegacyIntegrationKey(value) {
    const prefix = value.startsWith(LEGACY_INGEST_KEY_PREFIX)
        ? LEGACY_INGEST_KEY_PREFIX
        : value.startsWith(LEGACY_CONNECTION_PREFIX)
            ? LEGACY_CONNECTION_PREFIX
            : value.startsWith(LEGACY_INTEGRATION_PREFIX) && value.length > 32
                ? LEGACY_INTEGRATION_PREFIX
                : null;
    if (!prefix)
        throw new Error("unsupported legacy integration key");
    const encoded = value.slice(prefix.length);
    if (!/^[A-Za-z0-9_-]+$/.test(encoded))
        throw new Error("invalid legacy integration key");
    try {
        const decoded = Buffer.from(encoded, "base64url").toString("utf8");
        return collectorBootstrapConfigSchema.parse(JSON.parse(decoded));
    }
    catch {
        throw new Error("invalid legacy integration key");
    }
}
/** @deprecated Legacy connection-bundle encoder retained for migration tests. */
export function encodeCollectorIngestKey(input) {
    const config = collectorBootstrapConfigSchema.parse(input);
    return `${LEGACY_INGEST_KEY_PREFIX}${Buffer.from(JSON.stringify(config), "utf8").toString("base64url")}`;
}
/** @deprecated Use collectorBootstrapConfigSchema. */
export const integrationKeyConfigSchema = collectorBootstrapConfigSchema;
/** @deprecated Use collectorBootstrapConfigSchema. */
export const collectorConnectionConfigSchema = collectorBootstrapConfigSchema;
/** @deprecated Use parseLegacyIntegrationKey. */
export const parseCollectorIngestKey = parseLegacyIntegrationKey;
/** @deprecated Use encodeCollectorIngestKey. */
export const encodeCollectorConnection = encodeCollectorIngestKey;
/** @deprecated Use parseLegacyIntegrationKey. */
export const parseCollectorConnection = parseLegacyIntegrationKey;
//# sourceMappingURL=collector-connection.js.map