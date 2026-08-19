import { type ObservationEnvelope } from "@seamward/contracts";
/**
 * Batched, signed, FAIL-OPEN envelope shipping.
 *
 * The collector runs inside the CUSTOMER'S process. The prime directive is
 * that Seamward being slow, down, or misconfigured must never affect the
 * host application:
 * - enqueue() never throws and never blocks.
 * - Shipping failures are counted and retried on the next flush - never
 *   surfaced as exceptions to the host.
 * - Bounded memory: when the queue exceeds maxQueueSize, the OLDEST
 *   envelopes are dropped (drop-oldest) and counted. Losing telemetry is
 *   acceptable; growing the customer's heap is not.
 *
 * Batches are signed with the collector credential (t=,v1= HMAC scheme from
 * @seamward/contracts) so ingest can authenticate and replay-protect.
 */
export interface ShipperConfig {
    endpoint: string;
    /** Current write-only ingestion authentication. */
    sourceKey?: string;
    ingestToken?: string;
    /** Legacy connection-bundle authentication. */
    credentialId?: string;
    secret?: string;
    maxBatchSize?: number;
    flushIntervalMs?: number;
    maxQueueSize?: number;
    /** Injected for tests. Defaults: globalThis.fetch / Date.now. */
    fetchFn?: typeof fetch;
    nowSec?: () => number;
}
export interface ShipperStats {
    enqueued: number;
    shipped: number;
    dropped: number;
    failedBatches: number;
    queueLength: number;
}
export interface Shipper {
    enqueue(envelope: ObservationEnvelope): void;
    /** Ship everything currently queued. Resolves when done; never rejects. */
    flush(): Promise<void>;
    /** Stop the interval timer and flush once. Never rejects. */
    stop(): Promise<void>;
    stats(): ShipperStats;
}
export declare function createShipper(config: ShipperConfig): Shipper;
