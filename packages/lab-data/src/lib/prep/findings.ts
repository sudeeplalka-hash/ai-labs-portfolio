// Corpus findings spine (Corpus Intelligence · Phase 0).
// One flat, typed ledger derived from the per-file checks the engine already
// runs, plus per-guideline rollups. This is the single model the Readiness
// Board (matrix cells) and the Remediation Backlog (ledger rows) will both
// render in Phase 1, and what graduates into the handoff's remediationBacklog.
// Pure derivation: no state, no UI, deterministic for identical input.

import type { CheckResult, GuidelineId, Level } from "./types";
import { RULEBOOK, RULEBOOK_LIST } from "./rulebook";
import type { CorpusFile } from "./corpus";

export type FindingStatus = "open" | "fixed" | "accepted-risk";

export interface CorpusFinding {
  /** Stable key: `${fileId}:${checkId}` — safe for React keys and status maps. */
  key: string;
  fileId: string;
  fileName: string;
  checkId: string;
  guideline: GuidelineId;
  name: string;
  level: Exclude<Level, "healthy">;
  detail: string;
  downstream: string;
  /** Present when the issue is fixable in-lab (same Fix the file view applies). */
  fixId?: string;
  fixLabel?: string;
  fixDelta?: number;
  status: FindingStatus;
}

export interface CategoryRollup {
  guideline: GuidelineId;
  /** Rulebook name — single source of truth for labels. */
  name: string;
  /** Rulebook rule line, the plain-language definition the Board shows. */
  definition: string;
  /** 0..100. Mean of per-file category scores (see weights below). */
  score: number;
  level: Level;
  findingCount: number;
  filesAffected: number;
}

/** Severity weights per finding, subtracted from a file's 100-point category
 * budget. Visible math: watch −10, risk −25, critical −45, floor 0. */
export const FINDING_WEIGHT: Record<Exclude<Level, "healthy">, number> = {
  watch: 10,
  risk: 25,
  critical: 45,
};

const isIssue = (c: CheckResult): c is CheckResult & { level: Exclude<Level, "healthy"> } =>
  c.level !== "healthy";

/** Flatten every non-healthy check across the corpus into findings, in stable
 * file-then-severity order (critical first inside a file). */
export function deriveCorpusFindings(files: CorpusFile[]): CorpusFinding[] {
  const sevRank: Record<Level, number> = { critical: 0, risk: 1, watch: 2, healthy: 3 };
  const out: CorpusFinding[] = [];
  for (const f of files) {
    const issues = f.report.checks.filter(isIssue).slice()
      .sort((a, b) => sevRank[a.level] - sevRank[b.level] || a.id.localeCompare(b.id));
    for (const c of issues) {
      out.push({
        key: `${f.id}:${c.id}`,
        fileId: f.id,
        fileName: f.name,
        checkId: c.id,
        guideline: c.guideline,
        name: c.name,
        level: c.level,
        detail: c.detail,
        downstream: c.downstream,
        fixId: c.fix?.id,
        fixLabel: c.fix?.label,
        fixDelta: c.fix?.delta,
        status: "open",
      });
    }
  }
  return out;
}

const levelFromScore = (score: number, worst: Level): Level => {
  if (worst === "critical") return "critical";
  if (score >= 85) return worst === "healthy" ? "healthy" : "watch";
  if (score >= 65) return "watch";
  if (score >= 40) return "risk";
  return "critical";
};

/** Roll findings up into all eight rulebook categories. Files with no findings
 * in a category contribute a full 100, so the rollup reflects the whole corpus,
 * not just its problem files. Findings with status "fixed" stop counting;
 * "accepted-risk" keeps the score hit but is excluded from the open count. */
export function rollupCategories(
  files: CorpusFile[],
  findings: CorpusFinding[],
): CategoryRollup[] {
  const n = Math.max(1, files.length);
  return RULEBOOK_LIST.map((g) => {
    const inCat = findings.filter((x) => x.guideline === g.id && x.status !== "fixed");
    const perFile = new Map<string, number>();
    for (const x of inCat) perFile.set(x.fileId, (perFile.get(x.fileId) ?? 0) + FINDING_WEIGHT[x.level]);
    let sum = 0;
    for (const f of files) sum += Math.max(0, 100 - (perFile.get(f.id) ?? 0));
    const score = Math.round(sum / n);
    const open = inCat.filter((x) => x.status === "open");
    const worst: Level = open.some((x) => x.level === "critical")
      ? "critical"
      : open.some((x) => x.level === "risk")
        ? "risk"
        : open.length
          ? "watch"
          : "healthy";
    return {
      guideline: g.id,
      name: RULEBOOK[g.id].name,
      definition: RULEBOOK[g.id].rule,
      score,
      level: score === 100 && !open.length ? "healthy" : levelFromScore(score, worst),
      findingCount: open.length,
      filesAffected: new Set(open.map((x) => x.fileId)).size,
    };
  });
}
