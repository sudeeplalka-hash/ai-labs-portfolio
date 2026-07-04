import type { LabSession, SessionGate } from "./session";

type Accent = "blue" | "emerald" | "amber" | "orange" | "rose";
type Status = "ok" | "warn" | "fail";
type BadgeColor = "emerald" | "amber" | "orange" | "rose";

export interface LiveKpi {
  label: string;
  value: string;
  unit?: string;
  accent: Accent;
  target?: string;
  interpretation?: string;
  tooltip?: string;
}

export interface LiveFunnelStep {
  name: string;
  value: number;
  color: string;
  desc: string;
}

export interface LiveTrendPoint {
  month: string;
  ready: number;
  target: number;
}

export interface LiveGateSlice {
  label: string;
  n: number;
  color: string;
}

export interface LiveQualityDim {
  label: string;
  value: number;
  target: number;
  mode: "higher-better" | "lower-better";
  suffix: string;
}

export interface LiveFileRow {
  name: string;
  type: string;
  profiled: Status;
  cleaned: Status;
  pii: Status;
  chunks: string;
  gate: { label: string; color: BadgeColor };
}

export interface LiveDashboard {
  total: number;
  hasData: boolean;
  kpis: LiveKpi[];
  funnel: LiveFunnelStep[];
  trend: LiveTrendPoint[];
  gateDist: LiveGateSlice[];
  quality: LiveQualityDim[];
  files: LiveFileRow[];
}

const GATE_COLOR: Record<SessionGate, string> = {
  Approved: "#16a34a",
  Conditional: "#d97706",
  Hold: "#ea580c",
  Rejected: "#dc2626",
};
const GATE_BADGE: Record<SessionGate, BadgeColor> = {
  Approved: "emerald",
  Conditional: "amber",
  Hold: "orange",
  Rejected: "rose",
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const ext = (name: string) => (name.split(".").pop() ?? "txt").toUpperCase();

export function aggregateSessions(sessions: LabSession[]): LiveDashboard {
  const total = sessions.length;
  if (total === 0) {
    return { total: 0, hasData: false, kpis: [], funnel: [], trend: [], gateDist: [], quality: [], files: [] };
  }

  const by = (g: SessionGate) => sessions.filter((s) => s.gate === g).length;
  const approved = by("Approved");
  const conditional = by("Conditional");
  const hold = by("Hold");
  const rejected = by("Rejected");
  const readyPct = Math.round((approved / total) * 100);
  const avgScore = Math.round(avg(sessions.map((s) => s.score)));

  const kpis: LiveKpi[] = [
    { label: "Files analyzed", value: String(total), accent: "blue", target: "this browser", interpretation: "Real files you've run through the Live Data Lab.", tooltip: "Count of recorded Live Data Lab and Corpus Builder sessions." },
    {
      label: "Ingestion-ready",
      value: String(readyPct),
      unit: "%",
      accent: readyPct >= 70 ? "emerald" : readyPct >= 40 ? "amber" : "orange",
      target: "approved / total",
      interpretation: "Share of your files that cleared the gate.",
      tooltip: "Sessions with an Approved gate, as a percent of all sessions.",
    },
    { label: "Avg readiness", value: String(avgScore), accent: "blue", target: "score / 100", interpretation: "Mean readiness score across your files.", tooltip: "Average readiness score over all sessions." },
    {
      label: "Blocked / held",
      value: String(hold + rejected),
      accent: hold + rejected > 0 ? "orange" : "emerald",
      target: `${rejected} rejected · ${hold} hold`,
      interpretation: "Files that need work before ingestion.",
      tooltip: "Sessions gated Hold or Rejected.",
    },
  ];

  const cleaned = approved + conditional + hold;
  const funnel: LiveFunnelStep[] = [
    { name: "Received", value: total, color: "#1f6fc4", desc: "Files you analyzed" },
    { name: "Profiled", value: total, color: "#0891b2", desc: "Structure detected" },
    { name: "Cleaned", value: cleaned, color: "#0d9488", desc: "Not rejected outright" },
    { name: "Guideline-cleared", value: approved + conditional, color: "#16a34a", desc: "Passed or conditional" },
    { name: "Approved", value: approved, color: "#15508c", desc: "Cleared the gate" },
    { name: "Handed to RAG", value: approved, color: "#7c3aed", desc: "Ready to embed" },
  ];

  // trend grouped by day
  const buckets = new Map<string, { ready: number; n: number; ts: number }>();
  for (const s of sessions) {
    const d = new Date(s.ts);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const b = buckets.get(label) ?? { ready: 0, n: 0, ts: s.ts };
    b.n += 1;
    if (s.gate === "Approved") b.ready += 1;
    b.ts = Math.min(b.ts, s.ts);
    buckets.set(label, b);
  }
  const trend: LiveTrendPoint[] = [...buckets.entries()]
    .sort((a, b) => a[1].ts - b[1].ts)
    .slice(-8)
    .map(([label, b]) => ({ month: label, ready: Math.round((b.ready / b.n) * 100), target: 80 }));

  const gateDist: LiveGateSlice[] = (["Approved", "Conditional", "Hold", "Rejected"] as SessionGate[])
    .map((g) => ({ label: g, n: by(g), color: GATE_COLOR[g] }))
    .filter((s) => s.n > 0);

  // quality dimensions
  const tab = sessions.filter((s) => s.kind === "tabular");
  const completeness = tab.length ? Math.round(100 - avg(tab.map((s) => s.missingPct ?? 0))) : 100;
  const dedup = tab.length
    ? Math.round(100 - avg(tab.map((s) => (s.rows && s.rows > 0 ? ((s.dups ?? 0) / s.rows) * 100 : 0))))
    : 100;
  const piiClear = Math.round((sessions.filter((s) => s.piiHits === 0).length / total) * 100);
  const avgChunkTokens = Math.round(avg(sessions.filter((s) => s.chunks > 0).map((s) => s.estTokens / s.chunks)));
  const quality: LiveQualityDim[] = [
    { label: "Completeness", value: completeness, target: 90, mode: "higher-better", suffix: "%" },
    { label: "De-duplication", value: dedup, target: 95, mode: "higher-better", suffix: "%" },
    { label: "PII clearance", value: piiClear, target: 95, mode: "higher-better", suffix: "%" },
    { label: "Avg chunk tokens", value: avgChunkTokens || 0, target: 512, mode: "lower-better", suffix: "" },
  ];

  const files: LiveFileRow[] = sessions.slice(0, 10).map((s) => ({
    name: s.name,
    type: ext(s.name),
    profiled: "ok",
    cleaned: (s.dups ?? 0) > 0 || (s.missingPct ?? 0) > 5 ? "warn" : "ok",
    pii: s.piiHits > 0 ? (s.gate === "Rejected" ? "fail" : "warn") : "ok",
    chunks: s.chunks.toLocaleString(),
    gate: { label: s.gate, color: GATE_BADGE[s.gate] },
  }));

  return { total, hasData: true, kpis, funnel, trend, gateDist, quality, files };
}
