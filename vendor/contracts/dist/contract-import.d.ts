import type { JsonSchemaSubset } from "./schema-compat.js";
export type ContractDirection = "inbound" | "outbound";
export type ContractProtocol = "http-api" | "http-webhook" | "scheduled-feed" | "queue";
export type ContractPayloadLocation = "request" | "response" | "message";
export interface ContractOperationDefinition {
    operationKey: string;
    direction: ContractDirection;
    protocol: ContractProtocol;
    method?: string;
    routeTemplate?: string;
    eventType?: string;
    payloadLocation: ContractPayloadLocation;
    statusSelector?: string;
    schema: JsonSchemaSubset;
}
export interface ContractObservationIdentity {
    direction: string;
    protocol: string;
    method?: string;
    routeTemplate?: string;
    eventType?: string;
    statusCode: number;
    payloadLocation: ContractPayloadLocation;
}
export declare function createJsonSchemaOperation(input: Omit<ContractOperationDefinition, "operationKey"> & {
    operationKey?: string;
}): ContractOperationDefinition;
export declare function operationMatchesObservation(operation: ContractOperationDefinition, observation: ContractObservationIdentity): boolean;
export type ContractOperationMatch = {
    kind: "matched";
    operation: ContractOperationDefinition;
    matchReason: "exact-status" | "status-class" | "default-status" | "any-status";
} | {
    kind: "ambiguous";
    operationKeys: string[];
    matchReason: "equal-precedence";
} | {
    kind: "none";
    matchReason: "no-matching-operation";
};
export declare function resolveContractOperation(operations: readonly ContractOperationDefinition[], observation: ContractObservationIdentity): ContractOperationMatch;
export declare function importOpenApiOperations(value: unknown, defaults: {
    direction: ContractDirection;
    protocol: ContractProtocol;
}): ContractOperationDefinition[];
