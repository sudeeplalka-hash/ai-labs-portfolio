// Deterministic mock data for the Executive Overview and Technical Pipeline.

export const EXEC_KPIS = [
  {
    label: "Files in pipeline",
    value: "2,140",
    accent: "blue" as const,
    target: "Q2 submissions",
    trend: "+18%",
    trendGood: true,
    interpretation: "Volume up as three new source systems onboarded.",
    tooltip: "The total number of files submitted for preparation this quarter, across every connected source system. It counts everything that entered the pipeline, whether or not it was eventually approved. It captures the raw workload the data team is being asked to handle.",
  },
  {
    label: "Ingestion-ready",
    value: "71",
    unit: "%",
    accent: "amber" as const,
    target: "target ≥ 80%",
    trend: "+6 pts",
    trendGood: true,
    interpretation: "Most files pass; PII redaction is the main gap.",
    tooltip: "The share of submitted files that cleared the ingestion gate on the first pass, against an 80% target. It is files approved without rework divided by total files submitted. It captures how clean your incoming data is before any manual fixing, the single best read on data readiness.",
  },
  {
    label: "Avg prep effort",
    value: "2.4",
    unit: " hrs",
    accent: "emerald" as const,
    target: "per file · was 3.6",
    trend: "−33%",
    trendGood: true,
    interpretation: "Automated profiling cut hands-on cleanup time.",
    tooltip: "The average number of analyst hours spent preparing one file before it is approved. It is total hands-on prep time divided by files processed. It captures the human cost of data prep, the number automation is trying to drive down.",
  },
  {
    label: "Blocked / rejected",
    value: "214",
    accent: "orange" as const,
    target: "10% of intake",
    trend: "−4%",
    trendGood: true,
    interpretation: "Mostly sensitive-data and licensing holds.",
    tooltip: "The number of files held or rejected at the ingestion gate this quarter, shown as a share of intake. A file is blocked when it fails a policy check, most often unredacted PII or unverified provenance. It captures the data you cannot safely use yet, and why.",
  },
];

export const FUNNEL = [
  { name: "Received", value: 2140, color: "#1f6fc4", desc: "Raw files submitted from all sources" },
  { name: "Profiled", value: 2086, color: "#0891b2", desc: "Readable & structure detected" },
  { name: "Cleaned", value: 1842, color: "#0d9488", desc: "Dedup, missing-value & format fixes" },
  { name: "Guideline-cleared", value: 1597, color: "#16a34a", desc: "PII, provenance & metadata resolved" },
  { name: "Approved", value: 1521, color: "#15508c", desc: "Passed the ingestion gate" },
  { name: "Handed to RAG", value: 1521, color: "#7c3aed", desc: "Embedded into the vector database" },
];

export const EFFORT = [
  { name: "Profiling", hrs: 0.3, color: "#1f6fc4" },
  { name: "Cleaning", hrs: 0.8, color: "#0891b2" },
  { name: "PII review", hrs: 0.6, color: "#0d9488" },
  { name: "Guideline sign off", hrs: 0.4, color: "#16a34a" },
  { name: "Chunk tuning", hrs: 0.3, color: "#d97706" },
];

export const TREND = [
  { month: "Jan", ready: 52, target: 80 },
  { month: "Feb", ready: 58, target: 80 },
  { month: "Mar", ready: 61, target: 80 },
  { month: "Apr", ready: 64, target: 80 },
  { month: "May", ready: 68, target: 80 },
  { month: "Jun", ready: 71, target: 80 },
];

export const EXEC_NARRATIVE = [
  {
    tone: "success" as const,
    title: "Effort is paying off",
    body: "Automated profiling dropped average prep time from 3.6 to 2.4 hours per file while volume grew 18%.",
  },
  {
    tone: "warn" as const,
    title: "One gap remains",
    body: "Readiness sits at 71% against an 80% target. The bottleneck is PII redaction and licensing sign off, not data quality.",
  },
  {
    tone: "info" as const,
    title: "Recommended focus",
    body: "Standardize redaction and pre-clear common source licenses to lift first-pass approval above target, which means fewer conflicting answers downstream in the RAG Evaluator.",
  },
];

export interface Stage {
  name: string;
  inn: number;
  out: number;
  yield: number;
  desc: string;
}

export const STAGES: Stage[] = [
  { name: "Ingest & decode", inn: 2140, out: 2086, yield: 97.5, desc: "54 files unreadable (corrupt / wrong encoding) → quarantined" },
  { name: "Profile structure", inn: 2086, out: 2086, yield: 100, desc: "Schema, types & cardinality inferred for every file" },
  { name: "Clean & normalize", inn: 2086, out: 1842, yield: 88.3, desc: "Dedup, trim, missing-value & date-format passes" },
  { name: "Apply org guidelines", inn: 1842, out: 1680, yield: 91.2, desc: "Freshness, provenance & metadata rules enforced" },
  { name: "PII scan & redact", inn: 1680, out: 1597, yield: 95.1, desc: "83 files needed redaction or manual sign off" },
  { name: "Chunk & embed-prep", inn: 1597, out: 1521, yield: 95.2, desc: "Semantic split at ~512 tokens; 76 over-length re-split" },
];

export const QUALITY_DIMS = [
  { label: "Completeness", value: 94, target: 90, mode: "higher-better" as const, suffix: "%" },
  { label: "De-duplication", value: 97, target: 95, mode: "higher-better" as const, suffix: "%" },
  { label: "PII clearance", value: 87, target: 95, mode: "higher-better" as const, suffix: "%" },
  { label: "Metadata coverage", value: 82, target: 90, mode: "higher-better" as const, suffix: "%" },
  { label: "Format consistency", value: 91, target: 90, mode: "higher-better" as const, suffix: "%" },
  { label: "Avg chunk tokens", value: 468, target: 512, mode: "lower-better" as const, suffix: "" },
];

export interface FileRow {
  name: string;
  type: string;
  profiled: "ok" | "warn" | "fail";
  cleaned: "ok" | "warn" | "fail";
  pii: "ok" | "warn" | "fail";
  chunks: string;
  gate: { label: string; color: "emerald" | "amber" | "orange" | "rose" };
}

export const FILE_ROWS: FileRow[] = [
  { name: "policies_2024.pdf.txt", type: "TXT", profiled: "ok", cleaned: "ok", pii: "ok", chunks: "312", gate: { label: "Approved", color: "emerald" } },
  { name: "crm_export_v2.csv", type: "CSV", profiled: "ok", cleaned: "warn", pii: "fail", chunks: "1,204", gate: { label: "Rejected", color: "rose" } },
  { name: "vendor_kb.json", type: "JSON", profiled: "ok", cleaned: "ok", pii: "ok", chunks: "880", gate: { label: "Approved", color: "emerald" } },
  { name: "support_tickets.csv", type: "CSV", profiled: "ok", cleaned: "ok", pii: "warn", chunks: "2,460", gate: { label: "Conditional", color: "amber" } },
  { name: "travel_policy_v2.7.txt", type: "TXT", profiled: "ok", cleaned: "warn", pii: "ok", chunks: "140", gate: { label: "Hold", color: "orange" } },
  { name: "eng_update_q2.md", type: "MD", profiled: "ok", cleaned: "ok", pii: "ok", chunks: "96", gate: { label: "Approved", color: "emerald" } },
];
