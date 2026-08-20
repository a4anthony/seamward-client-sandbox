import { createHash } from "node:crypto";
export const OPERATION_IDENTITY_VERSION = "1";
export function defaultPayloadLocation(scope) {
    if (scope.protocol !== "http-api")
        return "message";
    return scope.direction === "inbound" ? "request" : "response";
}
export function normalizeRouteTemplate(routeTemplate, protocol = "http-api") {
    const trimmed = routeTemplate.trim();
    if (protocol === "queue" || protocol === "scheduled-feed") {
        if (trimmed.length > 256 ||
            !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(trimmed)) {
            throw new Error("operation target must be a bounded low-cardinality label");
        }
        return trimmed;
    }
    if (trimmed.length > 256 ||
        !/^\/[^?#\s\u0000-\u001F\u007F]*$/.test(trimmed)) {
        throw new Error("route template must be a bounded absolute path");
    }
    const segments = trimmed.split("/").map((segment) => {
        if (/^:[A-Za-z_][A-Za-z0-9_]*$/.test(segment))
            return "{}";
        if (/^\{[^{}\/]+\}$/.test(segment))
            return "{}";
        return segment;
    });
    return segments.join("/");
}
export function buildOperationIdentity(input) {
    const routeTemplate = normalizeRouteTemplate(input.routeTemplate, input.protocol);
    const payloadLocation = input.payloadLocation ?? defaultPayloadLocation(input);
    const eventType = input.eventType ?? null;
    const canonical = JSON.stringify([
        OPERATION_IDENTITY_VERSION,
        input.direction,
        input.protocol,
        input.method,
        routeTemplate,
        eventType,
        payloadLocation,
    ]);
    const key = `sha256:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
    return {
        version: OPERATION_IDENTITY_VERSION,
        key,
        direction: input.direction,
        protocol: input.protocol,
        method: input.method,
        routeTemplate,
        eventType,
        payloadLocation,
    };
}
//# sourceMappingURL=operation-identity.js.map