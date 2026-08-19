import { type DeploymentContext } from "@seamward/contracts";
export type DeploymentEnvironment = Readonly<Record<string, string | undefined>>;
/**
 * Resolve bounded, low-cardinality deployment evidence without making it a
 * collector requirement. Explicit SDK values win; known runtime variables are
 * fallbacks. Invalid values are ignored rather than breaking host telemetry.
 */
export declare function resolveDeploymentContext(explicit?: Partial<DeploymentContext>, environment?: DeploymentEnvironment): DeploymentContext | undefined;
