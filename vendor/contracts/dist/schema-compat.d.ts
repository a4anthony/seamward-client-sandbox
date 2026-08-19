import type { Shape } from "./shape.js";
/**
 * Declared-vs-observed compatibility: compare an observed payload Shape
 * against a declared JSON Schema (pragmatic subset).
 *
 * This is deliberately a FINDINGS generator, not a boolean: every deviation
 * is typed and pathed, because these findings are the raw material the
 * Week-4 drift engine folds into incidents. Fingerprint equality would only
 * say "something changed"; this says what, where.
 *
 * Supported schema subset (enough for webhook payloads; extend by need):
 * type (string | string[]), properties, required, items, enum (type check
 * only), additionalProperties (informational - unexpected fields are always
 * reported; policy decides severity later).
 */
export interface JsonSchemaSubset {
    type?: string | string[];
    properties?: Record<string, JsonSchemaSubset>;
    required?: string[];
    items?: JsonSchemaSubset;
    enum?: unknown[];
    additionalProperties?: boolean | JsonSchemaSubset;
}
export type CompatFindingKind = "missing-required-field" | "unexpected-field" | "type-mismatch";
export interface CompatFinding {
    kind: CompatFindingKind;
    /** JSON path, e.g. "$.candidate.email" */
    path: string;
    expected?: string;
    observed?: string;
}
/** Compare an observed Shape to a declared schema. Empty array = compatible. */
export declare function compareShapeToSchema(shape: Shape, schema: JsonSchemaSubset, path?: string): CompatFinding[];
