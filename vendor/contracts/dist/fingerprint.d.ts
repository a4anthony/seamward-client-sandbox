/**
 * Structural schema fingerprinting.
 *
 * A fingerprint captures the SHAPE of a JSON value - field names and types,
 * not values - so two payloads with identical structure produce identical
 * fingerprints regardless of content, key order, or array length. Drift
 * detection compares fingerprints (and their underlying signatures) across
 * time and against declared contracts.
 *
 * Signature grammar (canonical, deterministic):
 *   null | boolean | number | string
 *   [T]            - array of unified element signature ("[]" when empty)
 *   {k1:T1,k2:T2}  - object with keys sorted lexicographically
 *   T1|T2          - union of distinct signatures, sorted (heterogeneous arrays)
 */
export type Json = null | boolean | number | string | Json[] | {
    [key: string]: Json;
};
/** Compute the canonical structural signature of a JSON value. */
export declare function structuralSignature(value: Json): string;
/** sha256 fingerprint of the structural signature, "sha256:"-prefixed. */
export declare function schemaFingerprint(value: Json): string;
