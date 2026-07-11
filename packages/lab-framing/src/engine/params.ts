// ============================================================================
// The 5 framing parameters (BRIEF §8). Every parameter must visibly move the
// output. These weighting tables are the craft, tune here, not in the UI.
// ============================================================================
import type {
  UserKey, JobKey, PainKey, PainMode, PostureKey, RiskKey, BucketKey,
} from "./types";

export const USERS: Record<UserKey, { vol: number }> = {
  "Employees": { vol: 0.8 },
  "Customers": { vol: 1.0 },
  "Analysts": { vol: 0.5 },
  "Frontline staff": { vol: 0.75 },
  "Developers": { vol: 0.5 },
  "Executives": { vol: 0.35 },
  "Partners": { vol: 0.6 },
};

export const JOBS: Record<JobKey, { diff: number; freq: number; need: number; verb: string }> = {
  "Answer": { diff: 0.2, freq: 0.9, need: 0.7, verb: "answer questions for" },
  "Summarize": { diff: 0.3, freq: 0.7, need: 0.5, verb: "summarize information for" },
  "Extract": { diff: 0.45, freq: 0.6, need: 0.8, verb: "extract structured data for" },
  "Classify": { diff: 0.45, freq: 0.7, need: 0.7, verb: "classify items for" },
  "Decide": { diff: 0.8, freq: 0.6, need: 0.85, verb: "recommend decisions for" },
  "Monitor": { diff: 0.6, freq: 0.85, need: 0.8, verb: "monitor activity for" },
  "Generate": { diff: 0.6, freq: 0.7, need: 0.4, verb: "draft content for" },
  "Orchestrate": { diff: 0.9, freq: 0.65, need: 0.85, verb: "orchestrate work for" },
};

export const PAINS: Record<PainKey, { sev: number; phr: string; mode: PainMode }> = {
  "Too slow": { sev: 0.6, phr: "waiting", mode: "throughput" },
  "Inconsistent": { sev: 0.65, phr: "getting different answers each time", mode: "correctness" },
  "Too expensive": { sev: 0.7, phr: "burning budget", mode: "throughput" },
  "Hard to scale": { sev: 0.7, phr: "hitting a ceiling", mode: "coverage" },
  "Error prone": { sev: 0.85, phr: "making frequent mistakes", mode: "correctness" },
  "Knowledge trapped": { sev: 0.75, phr: "hunting for what's already known", mode: "coverage" },
  "Poor experience": { sev: 0.6, phr: "frustrated", mode: "experience" },
  "Impossible today": { sev: 0.9, phr: "unable to do this at all", mode: "coverage" },
  "Costly mistakes": { sev: 0.9, phr: "paying for every mistake twice", mode: "correctness" },
  "Compliance exposure": { sev: 0.95, phr: "one bad answer from an audit finding", mode: "correctness" },
  "Trust erosion": { sev: 0.8, phr: "quietly losing confidence", mode: "experience" },
};

export const painMode = (k: PainKey): PainMode => PAINS[k].mode;

export const POSTURE: Record<PostureKey, { self: number }> = {
  "Rich & ready": { self: 0.85 },
  "Scattered": { self: 0.55 },
  "Sparse": { self: 0.30 },
  "Unstructured": { self: 0.40 },
};

export const RISKS: RiskKey[] = ["Conservative", "Balanced", "Aggressive"];

export const PARAM_DEFS = [
  { key: "user", label: "User", opts: Object.keys(USERS) as UserKey[] },
  { key: "job", label: "Job", opts: Object.keys(JOBS) as JobKey[] },
  { key: "pain", label: "Pain", opts: Object.keys(PAINS) as PainKey[] },
  { key: "posture", label: "Data posture", opts: Object.keys(POSTURE) as PostureKey[] },
  { key: "risk", label: "Risk appetite", opts: RISKS },
] as const;

export const BUCKETS: Record<BucketKey, { color: string; soft: string; text: string; ring: string }> = {
  Wins: { color: "#16a34a", soft: "#dcfce7", text: "#15803d", ring: "rgba(22,163,74,0.2)" },
  Core: { color: "#1f6fc4", soft: "#eaf2fb", text: "#15508c", ring: "rgba(31,111,196,0.2)" },
  Differentiators: { color: "#7c3aed", soft: "#f3e8ff", text: "#6d28d9", ring: "rgba(124,58,237,0.2)" },
  Foundations: { color: "#d97706", soft: "#fef3c7", text: "#b45309", ring: "rgba(217,119,6,0.2)" },
};
