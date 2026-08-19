import { createHash } from "node:crypto";
/** Compute the canonical structural signature of a JSON value. */
export function structuralSignature(value) {
    if (value === null)
        return "null";
    const t = typeof value;
    if (t === "boolean" || t === "number" || t === "string")
        return t;
    if (Array.isArray(value)) {
        const parts = [...new Set(value.map(structuralSignature))].sort();
        return parts.length === 0 ? "[]" : `[${parts.join("|")}]`;
    }
    const entries = Object.keys(value)
        .sort()
        .map((k) => `${k}:${structuralSignature(value[k])}`);
    return `{${entries.join(",")}}`;
}
/** sha256 fingerprint of the structural signature, "sha256:"-prefixed. */
export function schemaFingerprint(value) {
    const sig = structuralSignature(value);
    const hash = createHash("sha256").update(sig, "utf8").digest("hex");
    return `sha256:${hash}`;
}
//# sourceMappingURL=fingerprint.js.map