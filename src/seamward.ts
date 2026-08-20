import { createSeamwardCollector } from "@seamward/collector";
import { parseConnectionKey } from "@seamward/contracts";
import { execFileSync } from "node:child_process";

type Environment = Readonly<Record<string, string | undefined>>;

function required(environment: Environment, name: string): string {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function currentCommitSha(): string | undefined {
  try {
    const value = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^[a-f0-9]{7,64}$/i.test(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function createConfiguredCollector(
  environment: Environment = process.env,
) {
  const connectionKey = required(environment, "SEAMWARD_CONNECTION_KEY");
  const { integrationKey } = parseConnectionKey(connectionKey);
  const collector = createSeamwardCollector({
    connectionKey,
    ingestToken: required(environment, "SEAMWARD_INGEST_TOKEN"),
    endpoint: environment.SEAMWARD_INGEST_URL,
    deployment: {
      service: environment.SEAMWARD_SERVICE ?? "candidate-api",
      release: environment.SEAMWARD_RELEASE,
      commitSha:
        environment.SEAMWARD_COMMIT_SHA ??
        environment.GITHUB_SHA ??
        currentCommitSha(),
    },
    policy: {
      version: "candidate-api-redaction-v1",
      dropFields: ["full_name"],
      hashFields: ["email_address", "candidate_email"],
      hashNamespace: "candidate-api-demo-v2",
    },
  });
  return { collector, integrationKey };
}
