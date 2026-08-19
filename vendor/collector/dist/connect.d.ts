import { type Json } from "@seamward/contracts";
import { type Collector, type CollectorConfig, type FetchMeta, type ObservedFetch, type RecordInput, type WebhookMeta, type WebhookResult } from "./observe.js";
import type { RedactionPolicy } from "./redact.js";
export interface ConnectOptions extends Pick<CollectorConfig, "deployment" | "builderDeps" | "maxBatchSize" | "flushIntervalMs" | "maxQueueSize" | "fetchFn" | "nowSec"> {
    /** Override for self-hosted and local Seamward ingestion. */
    endpoint?: string;
    policy?: Omit<RedactionPolicy, "hashKey">;
}
export interface CreateSeamwardCollectorConfig extends ConnectOptions {
    /** Public application/environment identifier. Grants no read or management access. */
    sourceKey: string;
    /** Write-only server credential. Store this in an environment variable. */
    ingestToken: string;
}
export type ConnectedRecordInput = Omit<RecordInput, "integrationId"> & {
    integrationKey: string;
};
export type ConnectedWebhookMeta = Omit<WebhookMeta, "integrationId"> & {
    integrationKey: string;
};
export type ConnectedFetchMeta = Omit<FetchMeta, "integrationId"> & {
    integrationKey: string;
};
export interface ConnectedCollector extends Omit<Collector, "record" | "observeWebhook" | "observeFetch"> {
    record(input: ConnectedRecordInput): void;
    observeWebhook<R extends WebhookResult | void>(meta: ConnectedWebhookMeta, handler: (payload: Json) => R | Promise<R>): (payload: Json) => Promise<R>;
    observeFetch(meta: ConnectedFetchMeta, fetchFn?: typeof fetch): ObservedFetch;
}
/**
 * Backend collector setup. The public Source key identifies the deployed
 * application; Integration keys route its observations, and the write-only
 * ingest token authenticates and signs every batch.
 */
export declare function createSeamwardCollector({ sourceKey: rawSourceKey, ingestToken: rawIngestToken, endpoint, policy, ...options }: CreateSeamwardCollectorConfig): ConnectedCollector;
