import type {
  GateStatus,
  ReleaseRecommendation,
  RiskLevel,
  Status,
  SupportStatus,
  EvaluationStatus,
  FreshnessStatus,
} from "@rag/types";

// Production thresholds used across the dashboard and scoring utilities.
export const THRESHOLDS = {
  overallScore: 80,
  citationAccuracy: 85,
  faithfulness: 85,
  highRiskPassRate: 90,
  p95LatencyMs: 4000,
  costPerQuery: 0.045,
  maxOverallRegression: 3,
  maxCitationRegression: 5,
};

// Light-theme badge styles (soft tint + readable -700 text + subtle ring).
export const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  High: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  Critical: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
};

export const STATUS_STYLES: Record<Status, string> = {
  Healthy: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Watch: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  "At Risk": "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  Critical: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
};

export const GATE_STYLES: Record<GateStatus, string> = {
  Passed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  Failed: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  "Not Evaluated": "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20",
};

export const RELEASE_STYLES: Record<ReleaseRecommendation, string> = {
  Promote: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  "Promote with Monitoring": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  Hold: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  Block: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
};

export const SUPPORT_STYLES: Record<SupportStatus, string> = {
  Supported: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  "Partially Supported": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  Unsupported: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20",
  Contradicted: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  "Not Enough Evidence": "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20",
};

export const EVAL_STATUS_STYLES: Record<EvaluationStatus, string> = {
  Passed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Failed: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  "Needs Review": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  Skipped: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20",
};

export const FRESHNESS_STYLES: Record<FreshnessStatus, string> = {
  Current: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  Stale: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  Unknown: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20",
};

// Multicolor chart palette tuned for a light background.
export const CHART_COLORS = {
  blue: "#1f6fc4",
  cyan: "#0891b2",
  teal: "#0d9488",
  emerald: "#16a34a",
  amber: "#d97706",
  orange: "#ea580c",
  rose: "#e11d48",
  violet: "#7c3aed",
  slate: "#64748b",
  grid: "rgba(21,36,51,0.08)",
  axis: "#5f6f81",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  Low: CHART_COLORS.emerald,
  Medium: CHART_COLORS.amber,
  High: CHART_COLORS.orange,
  Critical: CHART_COLORS.rose,
};

export const PRODUCT_THESIS =
  "Basic RAG proves that answers can be generated. Production RAG requires proof that answers are retrieved from the right sources, grounded in evidence, cited accurately, monitored continuously, and governed responsibly.";
