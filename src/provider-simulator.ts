export type ProviderVariant = "healthy" | "field-rename" | "type-change";
export type CandidateOperation =
  | "candidate.create"
  | "candidate.update"
  | "candidate.status_changed"
  | "candidate.document_uploaded";

export type CandidateProviderPayload = Readonly<Record<string, Json>> & {
  event_id: string;
  event_type: CandidateOperation;
  id: string;
};

export interface SendCandidateOptions {
  operation?: CandidateOperation;
  variant?: ProviderVariant;
  id?: string;
  attempt?: number;
}

export function candidatePayload(
  options?: SendCandidateOptions,
): CandidateProviderPayload;
export function candidatePayload(
  variant?: ProviderVariant,
  id?: string,
): CandidateProviderPayload;
export function candidatePayload(
  optionsOrVariant: SendCandidateOptions | ProviderVariant = {},
  legacyId?: string,
): CandidateProviderPayload {
  const options =
    typeof optionsOrVariant === "string"
      ? { variant: optionsOrVariant, id: legacyId }
      : optionsOrVariant;
  const {
    operation = "candidate.create",
    variant = "healthy",
    id = `cand_${Date.now()}`,
  } = options;
  const base = {
    event_id: `evt_${id}_${operation.replaceAll(".", "_")}`,
    event_type: operation,
    id,
  } as const;

  if (operation === "candidate.status_changed") {
    return { ...base, status: "screening", changed_by: "ats-workflow" };
  }
  if (operation === "candidate.document_uploaded") {
    return {
      ...base,
      document_id: `doc_${id}`,
      document_type: "cv",
      storage_reference: "documents/demo-cv.pdf",
    };
  }
  if (operation === "candidate.update") {
    return {
      ...base,
      full_name: "Taylor Updated",
      email_address: "taylor.updated@example.test",
      changed_fields: ["full_name", "email_address"],
    };
  }

  const createBase = {
    ...base,
    full_name: "Taylor Example",
    external_reference: "ATS-1001" as string | number,
  };
  if (variant === "field-rename") {
    return { ...createBase, candidate_email: "taylor@example.test" };
  }
  if (variant === "type-change") {
    return {
      ...createBase,
      email_address: "taylor@example.test",
      external_reference: 1001,
    };
  }
  return { ...createBase, email_address: "taylor@example.test" };
}

function operationPath(operation: CandidateOperation): string {
  if (operation === "candidate.status_changed")
    return "/webhooks/candidates/status";
  if (operation === "candidate.document_uploaded") return "/webhooks/documents";
  return "/webhooks/candidates";
}

export async function sendCandidate(
  baseUrl: string,
  options: SendCandidateOptions = {},
): Promise<{
  statusCode: number;
  body: unknown;
  payload: CandidateProviderPayload;
}> {
  const payload = candidatePayload(options);
  const response = await fetch(
    `${baseUrl}${operationPath(payload.event_type)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-provider-attempt": String(options.attempt ?? 1),
      },
      body: JSON.stringify(payload),
    },
  );
  return {
    statusCode: response.status,
    body: await response.json(),
    payload,
  };
}
import type { Json } from "@seamward/contracts";
