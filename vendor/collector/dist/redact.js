import { createHash } from "node:crypto";
/**
 * Collector-side redaction - runs BEFORE anything leaves the customer process.
 *
 * Invariant (grep-provable across the codebase): raw payload bodies, credential
 * headers, and configured sensitive fields never appear in an envelope. The
 * collector transmits structure and keyed hashes, not content.
 */
/** Headers dropped unconditionally, whatever the policy says. */
export const ALWAYS_DROPPED_HEADERS = [
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
];
export function keyedHash(value, key) {
    return `sha256:${createHash("sha256").update(`${key}:${value}`, "utf8").digest("hex")}`;
}
/** Drop always-dropped + policy headers from a header map (case-insensitive). */
export function redactHeaders(headers, policy) {
    const dropped = new Set([
        ...ALWAYS_DROPPED_HEADERS,
        ...policy.dropFields.map((f) => f.toLowerCase()),
    ]);
    const out = {};
    for (const [k, v] of Object.entries(headers)) {
        if (!dropped.has(k.toLowerCase()))
            out[k] = v;
    }
    return out;
}
/**
 * Apply a redaction policy to a JSON payload, recursively:
 * - dropFields are removed wherever they appear
 * - hashFields are replaced with keyed hashes of their string form
 */
export function redactPayload(value, policy) {
    const drop = new Set(policy.dropFields.map((f) => f.toLowerCase()));
    const hash = new Set(policy.hashFields.map((f) => f.toLowerCase()));
    const walk = (v) => {
        if (v === null || typeof v !== "object")
            return v;
        if (Array.isArray(v))
            return v.map(walk);
        const out = {};
        for (const [k, child] of Object.entries(v)) {
            const key = k.toLowerCase();
            if (drop.has(key))
                continue;
            if (hash.has(key)) {
                out[k] = keyedHash(typeof child === "string" ? child : JSON.stringify(child), policy.hashKey);
                continue;
            }
            out[k] = walk(child);
        }
        return out;
    };
    return walk(value);
}
//# sourceMappingURL=redact.js.map