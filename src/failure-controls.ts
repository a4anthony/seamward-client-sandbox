export const failureModes = [
  "none",
  "silent-success",
  "auth-failure",
  "slow-processing",
] as const;
export type FailureMode = (typeof failureModes)[number];

export function isFailureMode(value: unknown): value is FailureMode {
  return (
    typeof value === "string" && failureModes.includes(value as FailureMode)
  );
}

export class FailureControls {
  #mode: FailureMode;

  constructor(initialMode: FailureMode = "none") {
    this.#mode = initialMode;
  }

  current(): FailureMode {
    return this.#mode;
  }

  set(mode: FailureMode): void {
    this.#mode = mode;
  }
}
