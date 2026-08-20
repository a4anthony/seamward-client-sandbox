export declare const OPERATION_IDENTITY_VERSION: "1";
export type OperationPayloadLocation = "request" | "response" | "message";
export interface OperationIdentityScope {
    direction: "inbound" | "outbound";
    protocol: "http-webhook" | "http-api" | "scheduled-feed" | "queue";
}
export interface OperationIdentityInput extends OperationIdentityScope {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    routeTemplate: string;
    eventType?: string;
    payloadLocation?: OperationPayloadLocation;
    /** Status participates in contract matching, but not the operation-family key. */
    statusCode?: number;
}
export interface OperationIdentity {
    version: typeof OPERATION_IDENTITY_VERSION;
    key: string;
    direction: OperationIdentityInput["direction"];
    protocol: OperationIdentityInput["protocol"];
    method: OperationIdentityInput["method"];
    routeTemplate: string;
    eventType: string | null;
    payloadLocation: OperationPayloadLocation;
}
export declare function defaultPayloadLocation(scope: OperationIdentityScope): OperationPayloadLocation;
export declare function normalizeRouteTemplate(routeTemplate: string, protocol?: OperationIdentityInput["protocol"]): string;
export declare function buildOperationIdentity(input: OperationIdentityInput): OperationIdentity;
