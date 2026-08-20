import type { DeploymentContext, Json } from "@seamward/contracts";
import { type ObservationInput, type BuilderDeps } from "./envelope-builder.js";
import type { RedactionPolicy } from "./redact.js";
import { type ShipperConfig, type ShipperStats } from "./shipper.js";
/**
 * The customer-facing surface. One collector per process:
 *
 *   const collector = createCollector({ ... });
 *   fastify.post("/webhooks/candidate", collector.observeWebhook(
 *     { integrationId: "int_ats", routeTemplate: "/webhooks/candidate" },
 *     async (payload) => { ...handle...; return { statusCode: 202 }; },
 *   ));
 *
 * Fail-open everywhere: record() and the wrapper never throw Seamward
 * errors into the host. A handler's own exception is recorded (500, not
 * accepted) and RETHROWN - the host's error semantics are untouched.
 */
export interface CollectorConfig extends Pick<ShipperConfig, "endpoint" | "credentialId" | "secret" | "sourceKey" | "ingestToken" | "maxBatchSize" | "flushIntervalMs" | "maxQueueSize" | "fetchFn" | "nowSec"> {
    tenantId: string;
    environmentId: string;
    policy: RedactionPolicy;
    /** Explicit values override supported deployment-platform variables. */
    deployment?: Partial<DeploymentContext>;
    /** Injected clock/id for tests. */
    builderDeps?: BuilderDeps;
    /** Monotonic elapsed-time clock. Defaults to performance.now(). */
    monotonicNowMs?: () => number;
}
export type RecordInput = Omit<ObservationInput, "tenantId" | "environmentId" | "deployment">;
export interface WebhookMeta {
    integrationId: string;
    routeTemplate: string;
    method?: ObservationInput["method"];
    attempt?: number;
    correlation?: ObservationInput["correlation"];
}
export interface WebhookResult {
    statusCode?: number;
    eventType?: ObservationInput["eventType"];
    outcome?: ObservationInput["outcome"];
    correlation?: ObservationInput["correlation"];
}
export interface FetchMeta {
    integrationId: string;
    /** Stable route template; never pass concrete IDs or query values. */
    routeTemplate: string;
    eventType?: ObservationInput["eventType"];
    /** Overrides the request method when a Request-like input obscures it. */
    method?: ObservationInput["method"];
    attempt?: number;
    correlation?: ObservationInput["correlation"];
}
export type ObservedFetch = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => Promise<Response>;
export interface CollectorStats extends ShipperStats {
    buildErrors: number;
}
export interface Collector {
    /** Record one observation. Never throws. */
    record(input: RecordInput): void;
    /** Wrap an inbound webhook handler; observation is recorded around it. */
    observeWebhook<R extends WebhookResult | void>(meta: WebhookMeta, handler: (payload: Json) => R | Promise<R>): (payload: Json) => Promise<R>;
    /** Wrap outbound HTTP calls without delaying response-body consumption. */
    observeFetch(meta: FetchMeta, fetchFn?: typeof fetch): ObservedFetch;
    flush(): Promise<void>;
    stop(): Promise<void>;
    stats(): CollectorStats;
}
export declare function createCollector(config: CollectorConfig): Collector;
