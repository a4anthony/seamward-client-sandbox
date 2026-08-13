import { sendCandidate, type ProviderVariant } from "../src/provider-simulator.js";

const baseUrl = process.env.SANDBOX_URL ?? "http://127.0.0.1:4100";

export async function setFailureMode(mode: "none" | "silent-success" | "auth-failure") {
  const response = await fetch(`${baseUrl}/test/failure-mode`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  if (!response.ok) throw new Error(`Failure mode not changed: ${response.status}`);
}

export async function send(variant: ProviderVariant = "healthy", id?: string) {
  const result = await sendCandidate(baseUrl, variant, id);
  console.log(JSON.stringify({ statusCode: result.statusCode, body: result.body }, null, 2));
  if (result.statusCode >= 500) process.exitCode = 1;
  return result;
}
