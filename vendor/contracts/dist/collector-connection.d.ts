import { z } from "zod";
export declare const collectorBootstrapConfigSchema: z.ZodObject<{
    endpoint: z.ZodEffects<z.ZodString, string, string>;
    credentialId: z.ZodString;
    secret: z.ZodString;
    hashKey: z.ZodString;
    tenantId: z.ZodString;
    environmentId: z.ZodString;
    integrationId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    endpoint: string;
    credentialId: string;
    secret: string;
    hashKey: string;
    tenantId: string;
    environmentId: string;
    integrationId: string;
}, {
    endpoint: string;
    credentialId: string;
    secret: string;
    hashKey: string;
    tenantId: string;
    environmentId: string;
    integrationId: string;
}>;
export type CollectorBootstrapConfig = z.infer<typeof collectorBootstrapConfigSchema>;
export declare const integrationKeySchema: z.ZodString;
export declare function formatIntegrationKey(token: string): string;
export declare function parseIntegrationKey(value: string): string;
export declare const sourceKeySchema: z.ZodString;
export declare function formatSourceKey(token: string): string;
export declare function parseSourceKey(value: string): string;
export interface CollectorConnectionKey {
    sourceKey: string;
    integrationKey: string;
    integrationId: string;
}
export declare const connectionKeySchema: z.ZodString;
/**
 * Combine the public source and integration identifiers into one runtime
 * value. This key contains no credential and grants no access by itself.
 */
export declare function formatConnectionKey(input: CollectorConnectionKey): string;
export declare function parseConnectionKey(value: string): CollectorConnectionKey;
export declare const ingestTokenSchema: z.ZodString;
export declare function formatIngestToken(secret: string): string;
export declare function parseIngestToken(value: string): string;
/** Decode connection bundles issued before opaque Integration keys. */
export declare function parseLegacyIntegrationKey(value: string): CollectorBootstrapConfig;
/** @deprecated Legacy connection-bundle encoder retained for migration tests. */
export declare function encodeCollectorIngestKey(input: CollectorBootstrapConfig): string;
/** @deprecated Use collectorBootstrapConfigSchema. */
export declare const integrationKeyConfigSchema: z.ZodObject<{
    endpoint: z.ZodEffects<z.ZodString, string, string>;
    credentialId: z.ZodString;
    secret: z.ZodString;
    hashKey: z.ZodString;
    tenantId: z.ZodString;
    environmentId: z.ZodString;
    integrationId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    endpoint: string;
    credentialId: string;
    secret: string;
    hashKey: string;
    tenantId: string;
    environmentId: string;
    integrationId: string;
}, {
    endpoint: string;
    credentialId: string;
    secret: string;
    hashKey: string;
    tenantId: string;
    environmentId: string;
    integrationId: string;
}>;
/** @deprecated Use collectorBootstrapConfigSchema. */
export declare const collectorConnectionConfigSchema: z.ZodObject<{
    endpoint: z.ZodEffects<z.ZodString, string, string>;
    credentialId: z.ZodString;
    secret: z.ZodString;
    hashKey: z.ZodString;
    tenantId: z.ZodString;
    environmentId: z.ZodString;
    integrationId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    endpoint: string;
    credentialId: string;
    secret: string;
    hashKey: string;
    tenantId: string;
    environmentId: string;
    integrationId: string;
}, {
    endpoint: string;
    credentialId: string;
    secret: string;
    hashKey: string;
    tenantId: string;
    environmentId: string;
    integrationId: string;
}>;
/** @deprecated Use CollectorBootstrapConfig. */
export type IntegrationKeyConfig = CollectorBootstrapConfig;
/** @deprecated Use CollectorBootstrapConfig. */
export type CollectorConnectionConfig = CollectorBootstrapConfig;
/** @deprecated Use parseLegacyIntegrationKey. */
export declare const parseCollectorIngestKey: typeof parseLegacyIntegrationKey;
/** @deprecated Use encodeCollectorIngestKey. */
export declare const encodeCollectorConnection: typeof encodeCollectorIngestKey;
/** @deprecated Use parseLegacyIntegrationKey. */
export declare const parseCollectorConnection: typeof parseLegacyIntegrationKey;
