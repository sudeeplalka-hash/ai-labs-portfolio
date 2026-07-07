import type { GuidelineId } from "./types";

// The org rulebook: each guideline the Data Lab enforces before data may be
// ingested. This is the concept the RAG Evaluator has no equivalent of.
export interface Guideline {
  id: GuidelineId;
  name: string;
  rule: string;
  /** Why it matters downstream, in the RAG system. */
  downstream: string;
}

export const RULEBOOK: Record<GuidelineId, Guideline> = {
  admissibility: {
    id: "admissibility",
    name: "Admissibility",
    rule: "Only approved source types and classifications may enter the knowledge base.",
    downstream: "Inadmissible sources become answerable facts the AI was never meant to surface.",
  },
  format: {
    id: "format",
    name: "Format & Schema",
    rule: "Files must decode cleanly and meet structure/encoding standards.",
    downstream: "Broken encoding and malformed rows produce garbled chunks and silent retrieval gaps.",
  },
  dedup: {
    id: "dedup",
    name: "De-duplication",
    rule: "One authoritative copy per fact; near duplicates are flagged.",
    downstream: "Duplicates inflate retrieval frequency and bias the AI toward repeated content.",
  },
  freshness: {
    id: "freshness",
    name: "Freshness & Versioning",
    rule: "Stale or superseded versions must be quarantined before ingestion.",
    downstream: "Stale versions cause the conflicting answers the RAG lab reports (e.g. Policy v2.7 vs v3.1).",
  },
  privacy: {
    id: "privacy",
    name: "Privacy & PII",
    rule: "PII must be redacted or explicitly approved before embedding.",
    downstream: "Anything embedded becomes retrievable, a privacy gate failure in governance.",
  },
  provenance: {
    id: "provenance",
    name: "Provenance & Licensing",
    rule: "Source and usage rights verified by a named owner.",
    downstream: "Unlicensed content embedded into answers is a compliance and legal exposure.",
  },
  taxonomy: {
    id: "taxonomy",
    name: "Taxonomy & Metadata",
    rule: "Required tags present: domain, owner, sensitivity, effective date.",
    downstream: "Missing metadata blocks filtering, access control, and trustworthy citations.",
  },
  chunk: {
    id: "chunk",
    name: "Chunk-readiness",
    rule: "Content segments cleanly within the embedding target band.",
    downstream: "Oversized or boilerplate heavy chunks degrade retrieval precision.",
  },
};

export const RULEBOOK_LIST: Guideline[] = [
  RULEBOOK.admissibility,
  RULEBOOK.format,
  RULEBOOK.dedup,
  RULEBOOK.freshness,
  RULEBOOK.privacy,
  RULEBOOK.provenance,
  RULEBOOK.taxonomy,
  RULEBOOK.chunk,
];
