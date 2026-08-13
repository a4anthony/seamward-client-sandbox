import { describe, expect, it } from "vitest";
import { firstScriptArgument } from "../scripts/arguments.js";

describe("script arguments", () => {
  it("ignores the package-manager separator", () => {
    expect(firstScriptArgument(["--", "cand_123"])).toBe("cand_123");
  });

  it("accepts a direct argument", () => {
    expect(firstScriptArgument(["cand_123"])).toBe("cand_123");
  });
});
