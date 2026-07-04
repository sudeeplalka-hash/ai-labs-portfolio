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
