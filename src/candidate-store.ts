export interface Candidate {
  id: string;
  emailAddress: string;
  fullName: string;
  externalReference: string;
  status: "new" | "screening" | "interview" | "hired" | "rejected";
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export class CandidateStore {
  readonly #candidates = new Map<string, Candidate>();

  save(candidate: Candidate): void {
    this.#candidates.set(candidate.id, candidate);
  }

  update(
    id: string,
    changes: Partial<Pick<Candidate, "emailAddress" | "fullName" | "status">>,
    updatedAt: string,
  ): Candidate | null {
    const current = this.#candidates.get(id);
    if (!current) return null;
    const updated = { ...current, ...changes, updatedAt };
    this.#candidates.set(id, updated);
    return updated;
  }

  addDocument(id: string, updatedAt: string): Candidate | null {
    const current = this.#candidates.get(id);
    if (!current) return null;
    const updated = {
      ...current,
      documentCount: current.documentCount + 1,
      updatedAt,
    };
    this.#candidates.set(id, updated);
    return updated;
  }

  get(id: string): Candidate | null {
    return this.#candidates.get(id) ?? null;
  }

  count(): number {
    return this.#candidates.size;
  }

  clear(): void {
    this.#candidates.clear();
  }
}
