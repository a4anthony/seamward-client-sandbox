import { signBody } from "@seamward/contracts";
export function createShipper(config) {
    const fetchFn = config.fetchFn ?? fetch;
    const nowSec = config.nowSec ?? (() => Math.floor(Date.now() / 1000));
    const maxBatchSize = config.maxBatchSize ?? 50;
    const maxQueueSize = config.maxQueueSize ?? 1000;
    const flushIntervalMs = config.flushIntervalMs ?? 5_000;
    let queue = [];
    const stats = { enqueued: 0, shipped: 0, dropped: 0, failedBatches: 0 };
    // Serialise flushes: concurrent callers await the same chain, batches
    // never interleave, and a rejection can never escape (fail-open).
    let chain = Promise.resolve();
    const timer = setInterval(() => {
        void flush();
    }, flushIntervalMs);
    // Never keep the customer's process alive just for telemetry.
    timer.unref?.();
    async function shipQueued() {
        while (queue.length > 0) {
            const batch = queue.slice(0, maxBatchSize);
            const body = JSON.stringify({ envelopes: batch });
            try {
                const signingSecret = config.ingestToken ?? config.secret;
                if (!signingSecret)
                    throw new Error("collector authentication is required");
                const response = await fetchFn(config.endpoint, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        ...(config.sourceKey && config.ingestToken
                            ? {
                                authorization: `Bearer ${config.ingestToken}`,
                                "x-seamward-source": config.sourceKey,
                            }
                            : config.credentialId
                                ? { "x-seamward-credential": config.credentialId }
                                : {}),
                        "x-seamward-signature": signBody(body, signingSecret, nowSec()),
                    },
                    body,
                });
                if (!response.ok) {
                    stats.failedBatches += 1;
                    return; // keep the batch queued; retry on next flush
                }
                queue = queue.slice(batch.length);
                stats.shipped += batch.length;
            }
            catch {
                stats.failedBatches += 1;
                return; // fail-open: never throw into the host app
            }
        }
    }
    function flush() {
        chain = chain.then(shipQueued).catch(() => { });
        return chain;
    }
    return {
        enqueue(envelope) {
            stats.enqueued += 1;
            queue.push(envelope);
            const overflow = queue.length - maxQueueSize;
            if (overflow > 0) {
                queue.splice(0, overflow);
                stats.dropped += overflow;
            }
        },
        flush,
        async stop() {
            clearInterval(timer);
            await flush();
        },
        stats() {
            return { ...stats, queueLength: queue.length };
        },
    };
}
//# sourceMappingURL=shipper.js.map