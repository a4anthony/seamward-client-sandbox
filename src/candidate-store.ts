export interface Candidate {
  id: string;
  emailAddress: string;
  fullName: string;
  externalReference: string;
  createdAt: string;
}

export class CandidateStore {
  readonly #candidates = new Map<string, Candidate>();

  save(candidate: Candidate): void {
    this.#candidates.set(candidate.id, candidate);
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
