import { createHash } from "node:crypto";
import { parseIngestToken, parseIntegrationKey, parseSourceKey, } from "@seamward/contracts";
import { createCollector, } from "./observe.js";
const defaultPolicy = {
    version: "seamward-default-v1",
    dropFields: [
        "password",
        "access_token",
        "refresh_token",
        "authorization",
        "cookie",
        "set-cookie",
    ],
    hashFields: [],
};
function defaultIngestEndpoint() {
    return process.env.SEAMWARD_INGEST_URL ?? "https://api.seamward.com/ingest";
}
/**
 * Backend collector setup. The public Source key identifies the deployed
 * application; Integration keys route its observations, and the write-only
 * ingest token authenticates and signs every batch.
 */
export function createSeamwardCollector({ sourceKey: rawSourceKey, ingestToken: rawIngestToken, endpoint = defaultIngestEndpoint(), policy = defaultPolicy, ...options }) {
    let sourceKey;
    let ingestToken;
    try {
        sourceKey = parseSourceKey(rawSourceKey);
    }
    catch {
        throw new Error("Seamward source key is invalid");
    }
    try {
        ingestToken = parseIngestToken(rawIngestToken);
    }
    catch {
        throw new Error("Seamward ingest token is invalid");
    }
    const collector = createCollector({
        endpoint,
        sourceKey,
        ingestToken,
        // These placeholders satisfy the local strict envelope contract. The API
        // replaces them with the token-bound scope before validation/persistence.
        tenantId: "ten_authenticated",
        environmentId: "env_authenticated",
        policy: {
            ...policy,
            hashKey: createHash("sha256").update(ingestToken).digest("base64url"),
        },
        ...options,
    });
    return {
        record: ({ integrationKey, ...input }) => collector.record({
            ...input,
            integrationId: parseIntegrationKey(integrationKey),
        }),
        observeWebhook: ({ integrationKey, ...meta }, handler) => collector.observeWebhook({ ...meta, integrationId: parseIntegrationKey(integrationKey) }, handler),
        observeFetch: ({ integrationKey, ...meta }, fetchFn) => collector.observeFetch({ ...meta, integrationId: parseIntegrationKey(integrationKey) }, fetchFn),
        flush: () => collector.flush(),
        stop: () => collector.stop(),
        stats: () => collector.stats(),
    };
}
//# sourceMappingURL=connect.js.map