import type { Json } from "./fingerprint.js";
/**
 * Structural shape - the parsed form of a structural signature.
 *
 * The signature string (see fingerprint.ts) is the canonical, hashable form;
 * the Shape tree is the comparable form the server uses for declared-vs-
 * observed analysis. Shapes contain field NAMES and TYPES only - never
 * values - so shipping them in envelopes stays within the metadata-only
 * capture posture (plan.md §9.1).
 */
export type Shape = {
    kind: "null";
} | {
    kind: "boolean";
} | {
    kind: "number";
} | {
    kind: "string";
} | {
    kind: "array";
    items: Shape[];
} | {
    kind: "object";
    fields: Record<string, Shape>;
};
/** Compute the Shape of a JSON value. */
export declare function shapeOf(value: Json): Shape;
/** Canonical signature string for a Shape - same grammar as structuralSignature. */
export declare function signatureOfShape(shape: Shape): string;
