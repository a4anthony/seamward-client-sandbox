import { normalizeRouteTemplate } from "./operation-identity.js";
function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
}
function schemaRecord(value) {
    return record(value);
}
function operationKey(input) {
    return [
        input.direction,
        input.protocol,
        input.method ?? "any",
        input.routeTemplate ?? "any",
        input.eventType ?? "any",
        input.payloadLocation,
        input.statusSelector ?? "any",
    ].join(":");
}
export function createJsonSchemaOperation(input) {
    if (input.method &&
        !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(input.method.toUpperCase())) {
        throw new Error("contract method is not supported");
    }
    if (input.statusSelector &&
        input.statusSelector !== "default" &&
        !/^[1-5](?:\d\d|XX)$/i.test(input.statusSelector)) {
        throw new Error("contract status selector is invalid");
    }
    if (input.eventType &&
        (input.eventType.length > 128 ||
            !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(input.eventType))) {
        throw new Error("contract event type is invalid");
    }
    const identity = {
        direction: input.direction,
        protocol: input.protocol,
        ...(input.method ? { method: input.method.toUpperCase() } : {}),
        ...(input.routeTemplate
            ? {
                routeTemplate: normalizeRouteTemplate(input.routeTemplate, input.protocol),
            }
            : {}),
        ...(input.eventType ? { eventType: input.eventType } : {}),
        payloadLocation: input.payloadLocation,
        ...(input.statusSelector ? { statusSelector: input.statusSelector } : {}),
    };
    return {
        operationKey: input.operationKey ?? operationKey(identity),
        ...identity,
        schema: input.schema,
    };
}
function statusMatches(selector, statusCode) {
    if (!selector || selector === "default")
        return true;
    if (/^[1-5]XX$/i.test(selector)) {
        return Math.floor(statusCode / 100) === Number(selector[0]);
    }
    return Number(selector) === statusCode;
}
export function operationMatchesObservation(operation, observation) {
    let observationRoute = observation.routeTemplate;
    if (observationRoute) {
        try {
            observationRoute = normalizeRouteTemplate(observationRoute, observation.protocol);
        }
        catch {
            return false;
        }
    }
    return (operation.direction === observation.direction &&
        operation.protocol === observation.protocol &&
        (!operation.method ||
            operation.method === observation.method?.toUpperCase()) &&
        (!operation.routeTemplate ||
            normalizeRouteTemplate(operation.routeTemplate, operation.protocol) ===
                observationRoute) &&
        (!operation.eventType || operation.eventType === observation.eventType) &&
        operation.payloadLocation === observation.payloadLocation &&
        statusMatches(operation.statusSelector, observation.statusCode));
}
function selectorRank(selector) {
    if (!selector)
        return 0;
    if (selector === "default")
        return 1;
    if (/^[1-5]XX$/i.test(selector))
        return 2;
    return 3;
}
function operationRank(operation) {
    return (selectorRank(operation.statusSelector) * 1_000 +
        Number(Boolean(operation.eventType)) * 100 +
        Number(Boolean(operation.routeTemplate)) * 10 +
        Number(Boolean(operation.method)));
}
export function resolveContractOperation(operations, observation) {
    const matches = operations
        .filter((operation) => operationMatchesObservation(operation, observation))
        .map((operation) => ({ operation, rank: operationRank(operation) }));
    if (matches.length === 0) {
        return { kind: "none", matchReason: "no-matching-operation" };
    }
    const bestRank = Math.max(...matches.map((match) => match.rank));
    const best = matches
        .filter((match) => match.rank === bestRank)
        .map((match) => match.operation)
        .sort((left, right) => left.operationKey.localeCompare(right.operationKey));
    if (best.length > 1) {
        return {
            kind: "ambiguous",
            operationKeys: best.map((operation) => operation.operationKey),
            matchReason: "equal-precedence",
        };
    }
    const operation = best[0];
    const rank = selectorRank(operation.statusSelector);
    return {
        kind: "matched",
        operation,
        matchReason: rank === 3
            ? "exact-status"
            : rank === 2
                ? "status-class"
                : rank === 1
                    ? "default-status"
                    : "any-status",
    };
}
function resolveLocalSchema(value, document, seen = new Set()) {
    const source = record(value);
    if (!source)
        return null;
    if (typeof source.$ref === "string") {
        const reference = source.$ref;
        if (!reference.startsWith("#/") || seen.has(reference))
            return null;
        let target = document;
        for (const segment of reference.slice(2).split("/")) {
            const current = record(target);
            if (!current)
                return null;
            target = current[segment.replaceAll("~1", "/").replaceAll("~0", "~")];
        }
        return resolveLocalSchema(target, document, new Set([...seen, reference]));
    }
    const schema = {};
    if (typeof source.type === "string" ||
        (Array.isArray(source.type) &&
            source.type.every((entry) => typeof entry === "string"))) {
        schema.type = source.type;
    }
    if (Array.isArray(source.required) &&
        source.required.every((entry) => typeof entry === "string")) {
        schema.required = source.required;
    }
    if (Array.isArray(source.enum))
        schema.enum = source.enum;
    if (typeof source.additionalProperties === "boolean") {
        schema.additionalProperties = source.additionalProperties;
    }
    else if (record(source.additionalProperties)) {
        const additional = resolveLocalSchema(source.additionalProperties, document, seen);
        if (additional)
            schema.additionalProperties = additional;
    }
    const properties = record(source.properties);
    if (properties) {
        schema.properties = Object.fromEntries(Object.entries(properties).flatMap(([name, child]) => {
            const resolved = resolveLocalSchema(child, document, seen);
            return resolved ? [[name, resolved]] : [];
        }));
    }
    if (source.items) {
        const items = resolveLocalSchema(source.items, document, seen);
        if (items)
            schema.items = items;
    }
    return schema;
}
const OPENAPI_METHODS = ["get", "post", "put", "patch", "delete"];
function jsonContentSchema(value) {
    const holder = record(value);
    const content = record(holder?.content);
    const media = record(content?.["application/json"] ?? content?.["application/*+json"]);
    return media?.schema;
}
export function importOpenApiOperations(value, defaults) {
    const document = record(value);
    if (!document || typeof document.openapi !== "string") {
        throw new Error("Enter a valid OpenAPI document");
    }
    const paths = record(document.paths);
    const operations = [];
    for (const [routeTemplate, pathValue] of Object.entries(paths ?? {})) {
        const path = record(pathValue);
        if (!path)
            continue;
        for (const method of OPENAPI_METHODS) {
            const operation = record(path[method]);
            if (!operation)
                continue;
            const baseKey = typeof operation.operationId === "string"
                ? operation.operationId
                : `${method.toUpperCase()} ${routeTemplate}`;
            const requestSchema = resolveLocalSchema(jsonContentSchema(operation.requestBody), document);
            if (requestSchema) {
                operations.push(createJsonSchemaOperation({
                    operationKey: `${baseKey}:request`,
                    ...defaults,
                    method,
                    routeTemplate,
                    payloadLocation: "request",
                    schema: requestSchema,
                }));
            }
            const responses = record(operation.responses);
            for (const [statusSelector, responseValue] of Object.entries(responses ?? {})) {
                const responseSchema = resolveLocalSchema(jsonContentSchema(responseValue), document);
                if (!responseSchema)
                    continue;
                operations.push(createJsonSchemaOperation({
                    operationKey: `${baseKey}:response:${statusSelector}`,
                    ...defaults,
                    method,
                    routeTemplate,
                    payloadLocation: "response",
                    statusSelector,
                    schema: responseSchema,
                }));
            }
        }
    }
    const webhooks = record(document.webhooks);
    for (const [webhookName, pathValue] of Object.entries(webhooks ?? {})) {
        const path = record(pathValue);
        if (!path)
            continue;
        for (const method of OPENAPI_METHODS) {
            const operation = record(path[method]);
            if (!operation)
                continue;
            const messageSchema = resolveLocalSchema(jsonContentSchema(operation.requestBody), document);
            if (!messageSchema)
                continue;
            const baseKey = typeof operation.operationId === "string"
                ? operation.operationId
                : `${method.toUpperCase()} ${webhookName}`;
            const eventType = typeof operation["x-seamward-event-type"] === "string"
                ? operation["x-seamward-event-type"]
                : webhookName;
            const routeTemplate = typeof operation["x-seamward-route-template"] === "string"
                ? operation["x-seamward-route-template"]
                : undefined;
            operations.push(createJsonSchemaOperation({
                operationKey: `${baseKey}:message`,
                ...defaults,
                method,
                ...(routeTemplate ? { routeTemplate } : {}),
                eventType,
                payloadLocation: "message",
                schema: messageSchema,
            }));
        }
    }
    if (operations.length === 0)
        throw new Error("No JSON operations were found");
    return operations;
}
//# sourceMappingURL=contract-import.js.map