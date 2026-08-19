import { createSeamwardCollector } from "@seamward/collector";

type Environment = Readonly<Record<string, string | undefined>>;

function required(environment: Environment, name: string): string {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function createConfiguredCollector(environment: Environment = process.env) {
  const integrationKey = required(environment, "SEAMWARD_INTEGRATION_KEY");
  const collector = createSeamwardCollector({
    sourceKey: required(environment, "SEAMWARD_SOURCE_KEY"),
    ingestToken: required(environment, "SEAMWARD_INGEST_TOKEN"),
    endpoint: environment.SEAMWARD_INGEST_URL,
    deployment: {
      service: environment.SEAMWARD_SERVICE ?? "candidate-api",
      release: environment.SEAMWARD_RELEASE,
      commitSha: environment.SEAMWARD_COMMIT_SHA ?? environment.GITHUB_SHA,
    },
    policy: {
      version: "candidate-api-redaction-v1",
      dropFields: ["full_name"],
      hashFields: ["email_address", "candidate_email"],
    },
  });
  return { collector, integrationKey };
}
