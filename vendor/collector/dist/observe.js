import { resolveDeploymentContext } from "./deployment-context.js";
import { buildEnvelope } from "./envelope-builder.js";
import { createShipper } from "./shipper.js";
export function createCollector(config) {
    const { tenantId, environmentId, policy, deployment: explicitDeployment, builderDeps, ...shipperConfig } = config;
    const deployment = resolveDeploymentContext(explicitDeployment);
    const shipper = createShipper(shipperConfig);
    let buildErrors = 0;
    const pendingInspections = new Set();
    const nowMs = () => (builderDeps?.now ? builderDeps.now().getTime() : Date.now());
    function record(input) {
        try {
            shipper.enqueue(buildEnvelope({
                ...input,
                tenantId,
                environmentId,
                ...(deployment ? { deployment } : {}),
            }, policy, builderDeps));
        }
        catch {
            // Fail-open: a malformed observation must never break the host app.
            buildErrors += 1;
        }
    }
    function observeWebhook(meta, handler) {
        return async (payload) => {
            const startedAt = nowMs();
            const base = {
                integrationId: meta.integrationId,
                direction: "inbound",
                protocol: "http-webhook",
                method: meta.method ?? "POST",
                routeTemplate: meta.routeTemplate,
                payload,
            };
            try {
                const result = await handler(payload);
                record({
                    ...base,
                    statusCode: result?.statusCode ?? 200,
                    durationMs: nowMs() - startedAt,
                    ...(result?.eventType ? { eventType: result.eventType } : {}),
                    ...(result?.outcome ? { outcome: result.outcome } : {}),
                    ...(result?.correlation ? { correlation: result.correlation } : {}),
                });
                return result;
            }
            catch (error) {
                record({
                    ...base,
                    statusCode: 500,
                    durationMs: nowMs() - startedAt,
                    outcome: { accepted: false },
                });
                throw error; // host error semantics untouched
            }
        };
    }
    function trackInspection(inspection) {
        let tracked;
        tracked = inspection.catch(() => { }).finally(() => {
            pendingInspections.delete(tracked);
        });
        pendingInspections.add(tracked);
    }
    async function waitForInspections() {
        while (pendingInspections.size > 0) {
            await Promise.all([...pendingInspections]);
        }
    }
    function observeFetch(meta, providerFetch = fetch) {
        return async (input, init) => {
            const startedAt = nowMs();
            const requestedMethod = meta.method ?? init?.method ??
                (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET");
            const method = requestedMethod.toUpperCase();
            const base = {
                integrationId: meta.integrationId,
                direction: "outbound",
                protocol: "http-api",
                method,
                routeTemplate: meta.routeTemplate,
                ...(meta.eventType ? { eventType: meta.eventType } : {}),
            };
            let response;
            try {
                response = await providerFetch(input, init);
            }
            catch (error) {
                record({
                    ...base,
                    statusCode: 0,
                    durationMs: nowMs() - startedAt,
                    outcome: { accepted: false },
                });
                throw error;
            }
            const durationMs = nowMs() - startedAt;
            // Clone and inspect asynchronously. The original response is returned as
            // soon as the provider fetch resolves, preserving host response timing.
            trackInspection(Promise.resolve().then(async () => {
                let payload;
                try {
                    payload = await response.clone().json();
                }
                catch {
                    // Empty or non-JSON responses still produce transport evidence.
                }
                record({
                    ...base,
                    statusCode: response.status,
                    durationMs,
                    ...(payload !== undefined ? { payload } : {}),
                    outcome: { accepted: response.ok },
                });
            }));
            return response;
        };
    }
    return {
        record,
        observeWebhook,
        observeFetch,
        async flush() {
            await waitForInspections();
            await shipper.flush();
        },
        async stop() {
            await waitForInspections();
            await shipper.stop();
        },
        stats: () => ({ ...shipper.stats(), buildErrors }),
    };
}
//# sourceMappingURL=observe.js.map