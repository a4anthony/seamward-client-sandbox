/** Compute the Shape of a JSON value. */
export function shapeOf(value) {
    if (value === null)
        return { kind: "null" };
    const t = typeof value;
    if (t === "boolean" || t === "number" || t === "string")
        return { kind: t };
    if (Array.isArray(value)) {
        // Unify element shapes by signature, sorted - mirrors the signature grammar.
        const bySignature = new Map();
        for (const item of value) {
            const shape = shapeOf(item);
            bySignature.set(signatureOfShape(shape), shape);
        }
        const items = [...bySignature.entries()]
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([, shape]) => shape);
        return { kind: "array", items };
    }
    const fields = {};
    for (const key of Object.keys(value).sort()) {
        fields[key] = shapeOf(value[key]);
    }
    return { kind: "object", fields };
}
/** Canonical signature string for a Shape - same grammar as structuralSignature. */
export function signatureOfShape(shape) {
    switch (shape.kind) {
        case "null":
        case "boolean":
        case "number":
        case "string":
            return shape.kind;
        case "array": {
            const parts = shape.items.map(signatureOfShape).sort();
            return parts.length === 0 ? "[]" : `[${parts.join("|")}]`;
        }
        case "object": {
            const entries = Object.keys(shape.fields)
                .sort()
                .map((k) => `${k}:${signatureOfShape(shape.fields[k])}`);
            return `{${entries.join(",")}}`;
        }
    }
}
//# sourceMappingURL=shape.js.map