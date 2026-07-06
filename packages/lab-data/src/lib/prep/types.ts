// Shared types for the deterministic data-prep engine.

export type Level = "healthy" | "watch" | "risk" | "critical";

// The organization's guideline categories, the Data Lab's signature concept.
export type GuidelineId =
  | "admissibility"
  | "format"
  | "dedup"
  | "freshness"
  | "privacy"
  | "provenance"
  | "taxonomy"
  | "chunk";

export type FileKind = "tabular" | "text";

export interface Fix {
  /** Stable id so the UI can toggle it. */
  id: string;
  label: string;
  /** Points added to the readiness score when this fix is applied. */
  delta: number;
  /** Whether applying this fix clears an otherwise-blocking issue. */
  unblocks?: boolean;
}

export interface CheckResult {
  id: string;
  guideline: GuidelineId;
  name: string;
  level: Level;
  detail: string;
  /** Plain-English: how this would surface downstream in the RAG Evaluator. */
  downstream: string;
  /** Present when the issue is fixable in-lab. */
  fix?: Fix;
}

export interface ColumnProfile {
  name: string;
  dominantType: string;
  missing: number;
  distinct: number;
  total: number;
  types: Record<string, number>;
  samples: string[];
}

export interface TabularProfile {
  kind: "tabular";
  rows: number;
  cols: number;
  columns: ColumnProfile[];
  emptyRows: number;
  dups: number;
  missingPct: number;
}

export interface TextProfile {
  kind: "text";
  words: number;
  lines: number;
  paras: number;
  chars: number;
  repeatedLines: number;
}

export type Profile = TabularProfile | TextProfile;

export interface PiiFinding {
  type: string;
  label: string;
  count: number;
  severe: boolean;
}

export interface ChunkPreview {
  count: number;
  avgTokens: number;
  estTokens: number;
  oversized: number;
  first: string;
}

export interface GateVerdict {
  /** 0-100 readiness. */
  score: number;
  verdict: "Ready" | "Needs review" | "Not ready" | "Blocked";
  /** badge color token */
  color: "emerald" | "amber" | "orange" | "rose";
  gate: "Approved" | "Conditional" | "Hold" | "Rejected";
  summary: string;
}

export interface PrepReport {
  fileName: string;
  sizeKB: number;
  ext: string;
  kind: FileKind;
  profile: Profile;
  checks: CheckResult[];
  pii: PiiFinding[];
  chunk: ChunkPreview;
  serialized: string;
  /** Score with no fixes applied. */
  baseScore: number;
}
