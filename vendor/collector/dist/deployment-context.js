import { deploymentContextSchema, } from "@seamward/contracts";
const commitEnvironmentKeys = [
    "SEAMWARD_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "RENDER_GIT_COMMIT",
    "RAILWAY_GIT_COMMIT_SHA",
    "GITHUB_SHA",
];
function validField(key, candidates) {
    for (const candidate of candidates) {
        if (candidate === undefined || candidate.length === 0)
            continue;
        const parsed = deploymentContextSchema.safeParse({ [key]: candidate });
        if (parsed.success)
            return parsed.data[key];
    }
    return undefined;
}
/**
 * Resolve bounded, low-cardinality deployment evidence without making it a
 * collector requirement. Explicit SDK values win; known runtime variables are
 * fallbacks. Invalid values are ignored rather than breaking host telemetry.
 */
export function resolveDeploymentContext(explicit = {}, environment = process.env) {
    const service = validField("service", [explicit.service, environment.SEAMWARD_SERVICE]);
    const commitSha = validField("commitSha", [
        explicit.commitSha?.toLowerCase(),
        ...commitEnvironmentKeys.map((key) => environment[key]?.toLowerCase()),
    ]);
    const release = validField("release", [
        explicit.release,
        environment.SEAMWARD_RELEASE,
        commitSha?.slice(0, 12),
    ]);
    const context = {
        ...(service ? { service } : {}),
        ...(release ? { release } : {}),
        ...(commitSha ? { commitSha } : {}),
    };
    const parsed = deploymentContextSchema.safeParse(context);
    return parsed.success ? parsed.data : undefined;
}
//# sourceMappingURL=deployment-context.js.map