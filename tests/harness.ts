import { buildCandidateApp } from "../src/app.js";

export function createHarness() {
  return buildCandidateApp({ enableTestControls: true });
}
