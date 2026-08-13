import { createRelayGuardCollector } from "@relayguard/collector";

type Environment = Readonly<Record<string, string | undefined>>;

function required(environment: Environment, name: string): string {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function createConfiguredCollector(environment: Environment = process.env) {
  const integrationKey = required(environment, "RELAYGUARD_INTEGRATION_KEY");
  const collector = createRelayGuardCollector({
    sourceKey: required(environment, "RELAYGUARD_SOURCE_KEY"),
    ingestToken: required(environment, "RELAYGUARD_INGEST_TOKEN"),
    endpoint: environment.RELAYGUARD_INGEST_URL,
    deployment: {
      service: environment.RELAYGUARD_SERVICE ?? "relayguard-client-sandbox",
      release: environment.RELAYGUARD_RELEASE,
      commitSha: environment.RELAYGUARD_COMMIT_SHA ?? environment.GITHUB_SHA,
    },
    policy: {
      version: "sandbox-redaction-v1",
      dropFields: ["full_name"],
      hashFields: ["email_address", "candidate_email"],
    },
  });
  return { collector, integrationKey };
}
