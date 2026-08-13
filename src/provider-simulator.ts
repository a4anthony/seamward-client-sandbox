export type ProviderVariant = "healthy" | "field-rename" | "type-change";

export interface CandidateProviderPayload {
  event_id: string;
  event_type: "candidate.create";
  id: string;
  full_name: string;
  email_address?: string;
  candidate_email?: string;
  external_reference: string | number;
}

export function candidatePayload(
  variant: ProviderVariant = "healthy",
  id = `cand_${Date.now()}`,
): CandidateProviderPayload {
  const base = {
    event_id: `evt_${id}`,
    event_type: "candidate.create" as const,
    id,
    full_name: "Taylor Example",
    external_reference: "ATS-1001" as string | number,
  };

  if (variant === "field-rename") {
    return { ...base, candidate_email: "taylor@example.test" };
  }
  if (variant === "type-change") {
    return { ...base, email_address: "taylor@example.test", external_reference: 1001 };
  }
  return { ...base, email_address: "taylor@example.test" };
}

export async function sendCandidate(
  baseUrl: string,
  variant: ProviderVariant = "healthy",
  id?: string,
): Promise<{ statusCode: number; body: unknown; payload: CandidateProviderPayload }> {
  const payload = candidatePayload(variant, id);
  const response = await fetch(`${baseUrl}/webhooks/candidates`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return {
    statusCode: response.status,
    body: await response.json(),
    payload,
  };
}
