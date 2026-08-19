/**
 * Collector→ingest request signing. Lives in contracts because BOTH sides use
 * it - the collector signs, the API verifies - and a single implementation is
 * the only way the two can never drift. (Drift between signer and verifier in
 * customer integrations is literally the product's villain.)
 *
 * Scheme: `t=<unix-seconds>,v1=<hex hmac-sha256 over "<t>.<body>">`
 * - Timestamp binding + tolerance window defeats replay.
 * - `v1=` leaves room for algorithm rotation; verification accepts multiple
 *   secrets so credentials can rotate without a hard cutover.
 */
export interface VerifyOptions {
    /** Unix seconds "now" - injected for testability. */
    nowSec: number;
    /** Accept signatures within ± this window (default 300s). */
    toleranceSec?: number;
}
export type VerifyResult = {
    valid: true;
} | {
    valid: false;
    reason: "malformed" | "stale" | "mismatch";
};
export declare function signBody(body: string, secret: string, timestampSec: number): string;
export declare function verifySignature(body: string, header: string, secrets: readonly string[], opts: VerifyOptions): VerifyResult;
