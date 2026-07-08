// Browser-persisted record of real Live Data Lab / Corpus Builder activity.
// Powers the "Demo ↔ Live" dashboard toggle, mirroring the RAG Evaluator's
// localStorage-backed live sessions. SSR-safe: all access is guarded.

export type SessionGate = "Approved" | "Conditional" | "Hold" | "Rejected";
export type SessionSource = "single" | "corpus";

export interface LabSession {
  id: string;
  ts: number;
  name: string;
  kind: "tabular" | "text";
  source: SessionSource;
  profileId: string;
  score: number;
  gate: SessionGate;
  piiHits: number;
  chunks: number;
  estTokens: number;
  rows?: number;
  dups?: number;
  missingPct?: number;
}

const KEY = "datalab.sessions.v1";
const CAP = 200;

function canUse(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getSessions(): LabSession[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LabSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordSession(s: Omit<LabSession, "id" | "ts">): void {
  if (!canUse()) return;
  try {
    const entry: LabSession = { ...s, id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ts: Date.now() };
    const next = [entry, ...getSessions()].slice(0, CAP);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function recordSessions(list: Omit<LabSession, "id" | "ts">[]): void {
  if (!canUse() || list.length === 0) return;
  try {
    const stamped: LabSession[] = list.map((s, i) => ({
      ...s,
      id: `s_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
    }));
    const next = [...stamped, ...getSessions()].slice(0, CAP);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearSessions(): void {
  if (!canUse()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Corpus backlog bridge (Phase 1): a compact snapshot of the Remediation
// Backlog for the current corpus session, read by DataSliceWriter so the
// Data Readiness Handoff can carry structured remediation entries.
// ---------------------------------------------------------------------------

export interface CorpusBacklogEntry {
  finding: string;
  guideline: string;
  severity: "watch" | "risk" | "critical";
  file?: string;
  recommendation?: string;
  status: "open" | "fixed" | "accepted-risk";
}

const BACKLOG_KEY = "datalab.corpusbacklog.v1";
const BACKLOG_CAP = 12;

export function getCorpusBacklog(): CorpusBacklogEntry[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(BACKLOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CorpusBacklogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordCorpusBacklog(entries: CorpusBacklogEntry[]): void {
  if (!canUse()) return;
  try {
    // Open items first (severity descending), then accepted risks; fixed items
    // don't travel, they're done.
    const rank = { critical: 0, risk: 1, watch: 2 } as const;
    const keep = entries
      .filter((e) => e.status !== "fixed")
      .sort((a, b) => (a.status === b.status ? rank[a.severity] - rank[b.severity] : a.status === "open" ? -1 : 1))
      .slice(0, BACKLOG_CAP);
    window.localStorage.setItem(BACKLOG_KEY, JSON.stringify(keep));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export interface CorpusExclusion {
  file: string;
  reason: string;
}

const EXCLUSIONS_KEY = "datalab.corpusexclusions.v1";

export function getCorpusExclusions(): CorpusExclusion[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(EXCLUSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CorpusExclusion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Snapshot of accepted duplicate/version exclusions for the current corpus
 * session. DataSliceWriter carries these into ProgramState, where the Data
 * Readiness Handoff merges them into blockedSources — from there Build's
 * re-rank and Govern's findings react with no extra wiring. */
export function recordCorpusExclusions(entries: CorpusExclusion[]): void {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(EXCLUSIONS_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {
    /* ignore quota / serialization errors */
  }
}
