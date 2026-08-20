import type { Json } from "@seamward/contracts";
/**
 * Collector-side redaction - runs BEFORE anything leaves the customer process.
 *
 * Invariant (grep-provable across the codebase): raw payload bodies, credential
 * headers, and configured sensitive fields never appear in an envelope. The
 * collector transmits structure and keyed hashes, not content.
 */
/** Headers dropped unconditionally, whatever the policy says. */
export declare const ALWAYS_DROPPED_HEADERS: readonly ["authorization", "proxy-authorization", "cookie", "set-cookie", "x-api-key"];
export interface RedactionPolicy {
    /** Policy identifier stamped into every envelope for auditability. */
    version: string;
    /** Non-secret key generation identifier. Derived from hashKey when omitted. */
    hashNamespace?: string;
    /** Case-insensitive field names whose values are dropped entirely. */
    dropFields: string[];
    /** Case-insensitive field names whose values are replaced by keyed hashes. */
    hashFields: string[];
    /** Key for hashing identifiers (NOT a secret shared with Seamward). */
    hashKey: string;
}
export declare function keyedHash(value: string, key: string): string;
/** Drop always-dropped + policy headers from a header map (case-insensitive). */
export declare function redactHeaders(headers: Record<string, string>, policy: RedactionPolicy): Record<string, string>;
/**
 * Apply a redaction policy to a JSON payload, recursively:
 * - dropFields are removed wherever they appear
 * - hashFields are replaced with keyed hashes of their string form
 */
export declare function redactPayload(value: Json, policy: RedactionPolicy): Json;
