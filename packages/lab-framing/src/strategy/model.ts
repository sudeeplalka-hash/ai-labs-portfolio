// ============================================================================
// Strategy & Planning, deterministic intake + readiness scoring engine.
// Pure functions: a Workshop object in, a Scored result + a mapped ProgramState
// initiative out. No API calls; everything runs in the browser.
// ============================================================================
import type { Initiative, InitiativeMeta, GovernanceTier, Criticality, BuildPathRecommendation } from "@labs/program-core";
import type { FramingParams, UseCase } from "../engine/types";
import { JOBS, PAINS } from "../engine/params";

export type YNU = "Yes" | "No" | "Unsure" | "";
export type Lvl = "Low" | "Medium" | "High" | "";
export type Impact = "Low" | "Medium" | "High" | "Critical" | "";

export interface Workshop {
  initiativeName: string;
  // Step 1, Business Context
  businessFunction: string;
  sponsor: string;
  process: string;
  painPoint: string;
  targetUsers: string;
  facing: "" | "Internal" | "Customer-facing";
  // Step 2, AI Ambition
  ambition: string;
  aiPattern: string;
  expectedAction: string;
  humanReview: YNU;
  // Step 3, Business Value
  baseline: string;
  target: string;
  usersImpacted: string;
  frequency: string;
  valueDriver: string;
  timeHorizon: string;
  // Step 4, Data Assumptions
  dataSources: string;
  dataOwner: string;
  dataSensitivity: "" | "Public" | "Internal" | "Confidential" | "PII" | "PHI" | "PCI";
  dataGaps: string;
  freshnessConcern: YNU;
  dataStructure: "" | "Structured" | "Unstructured" | "Mixed";
  // Step 5, Risk & Governance
  impactIfWrong: Impact;
  regulatory: "" | "None" | "Moderate" | "High" | "Unknown";
  auditTrail: YNU;
  citationRequired: YNU;
  escalationPath: YNU;
  // Step 6, Delivery Complexity
  integrations: string;
  workflowChange: Lvl;
  techDependency: Lvl;
  adoptionComplexity: Lvl;
  pilotUrgency: Lvl;
}

export function blankWorkshop(): Workshop {
  return {
    initiativeName: "", businessFunction: "", sponsor: "", process: "", painPoint: "", targetUsers: "", facing: "",
    ambition: "", aiPattern: "", expectedAction: "", humanReview: "",
    baseline: "", target: "", usersImpacted: "", frequency: "", valueDriver: "", timeHorizon: "",
    dataSources: "", dataOwner: "", dataSensitivity: "", dataGaps: "", freshnessConcern: "", dataStructure: "",
    impactIfWrong: "", regulatory: "", auditTrail: "", citationRequired: "", escalationPath: "",
    integrations: "", workflowChange: "", techDependency: "", adoptionComplexity: "", pilotUrgency: "",
  };
}

// ---- option lists (single source for the form selects) ----------------------
export const AI_PATTERNS = ["Search / knowledge assistant", "Summarization", "Classification", "Recommendation", "Decision support", "Workflow automation", "Agentic workflow"] as const;
export const VALUE_DRIVERS = ["Cost reduction", "Revenue lift", "Cycle-time reduction", "Quality improvement", "Risk reduction", "Customer experience"] as const;
export const TIME_HORIZONS = ["30 days", "60 days", "90 days", "6 months", "12 months"] as const;
export const SENSITIVITIES = ["Public", "Internal", "Confidential", "PII", "PHI", "PCI"] as const;
export const DATA_STRUCTURES = ["Structured", "Unstructured", "Mixed"] as const;
export const IMPACTS: Impact[] = ["Low", "Medium", "High", "Critical"];
export const REGULATORY = ["None", "Moderate", "High", "Unknown"] as const;
export const LEVELS: Lvl[] = ["Low", "Medium", "High"];
export const YNU_OPTS: YNU[] = ["Yes", "No", "Unsure"];

// ---- scoring ----------------------------------------------------------------
export interface CategoryScore { key: string; label: string; weight: number; score: number }
export interface Gate { key: string; label: string; passed: boolean }
export interface RiskItem { label: string; severity: "low" | "med" | "high" }
export type Band = "go" | "refine" | "redesign" | "stop";
export interface Scored {
  overall: number;
  categories: CategoryScore[];
  gates: Gate[];
  gatesPassed: boolean;
  missingGates: string[];
  band: Band;
  recommendation: string;
  risks: RiskItem[];
  nextAction: string;
}

const has = (s: string) => s.trim().length > 0;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const lvlScore = (l: Lvl, lowGood = true) => (l === "Low" ? (lowGood ? 90 : 40) : l === "Medium" ? 65 : l === "High" ? (lowGood ? 35 : 90) : 55);

function businessValue(w: Workshop): number {
  let s = 30;
  if (has(w.baseline)) s += 18;
  if (has(w.target)) s += 18;
  if (has(w.valueDriver)) s += 12;
  const users = parseInt(w.usersImpacted.replace(/[^\d]/g, ""), 10);
  if (!isNaN(users)) s += users >= 500 ? 12 : users >= 100 ? 8 : 4;
  if (has(w.frequency)) s += 8;
  return clamp(s);
}
function strategicAlignment(w: Workshop): number {
  let s = 35;
  if (has(w.sponsor)) s += 25;
  if (has(w.businessFunction)) s += 12;
  if (has(w.process)) s += 10;
  if (w.facing) s += 8;
  if (w.timeHorizon) s += (w.timeHorizon === "30 days" || w.timeHorizon === "60 days" || w.timeHorizon === "90 days") ? 12 : 6;
  return clamp(s);
}
function dataReadiness(w: Workshop): number {
  let s = 30;
  if (has(w.dataSources)) s += 22;
  if (has(w.dataOwner)) s += 14;
  if (w.dataStructure) s += w.dataStructure === "Structured" ? 14 : w.dataStructure === "Mixed" ? 9 : 5;
  if (has(w.dataGaps)) s -= Math.min(18, w.dataGaps.trim().length > 0 ? 12 : 0);
  if (w.freshnessConcern === "Yes") s -= 10; else if (w.freshnessConcern === "No") s += 8;
  if (w.dataSensitivity === "PII" || w.dataSensitivity === "PHI" || w.dataSensitivity === "PCI") s -= 6;
  return clamp(s + 12);
}
function techFeasibility(w: Workshop): number {
  let s = 55;
  const easy = ["Search / knowledge assistant", "Summarization", "Classification"];
  const hard = ["Agentic workflow", "Workflow automation"];
  if (easy.includes(w.aiPattern)) s += 14; else if (hard.includes(w.aiPattern)) s -= 12;
  if (has(w.integrations)) s -= Math.min(12, 8);
  s += (lvlScore(w.techDependency) - 55) * 0.4;
  return clamp(s);
}
function riskManageability(w: Workshop): number {
  let s = 60;
  if (w.impactIfWrong === "Low") s += 15; else if (w.impactIfWrong === "Medium") s += 5; else if (w.impactIfWrong === "High") s -= 12; else if (w.impactIfWrong === "Critical") s -= 22;
  if (w.regulatory === "None") s += 8; else if (w.regulatory === "High") s -= 12; else if (w.regulatory === "Unknown") s -= 14;
  // having decided the controls is itself manageability
  if (w.humanReview === "Yes") s += 8; else if (w.humanReview === "Unsure") s -= 6;
  if (w.auditTrail === "Yes") s += 5;
  if (w.citationRequired === "Yes") s += 5;
  if (w.escalationPath === "Yes") s += 6; else if (w.escalationPath === "Unsure") s -= 4;
  return clamp(s);
}
function adoptionReadiness(w: Workshop): number {
  let s = 45;
  s += (lvlScore(w.workflowChange) - 55) * 0.35;
  s += (lvlScore(w.adoptionComplexity) - 55) * 0.35;
  if (has(w.targetUsers)) s += 12;
  if (has(w.expectedAction)) s += 8;
  return clamp(s);
}

const CATS: { key: string; label: string; weight: number; fn: (w: Workshop) => number }[] = [
  { key: "value", label: "Business value", weight: 0.25, fn: businessValue },
  { key: "align", label: "Strategic alignment", weight: 0.15, fn: strategicAlignment },
  { key: "data", label: "Data readiness", weight: 0.2, fn: dataReadiness },
  { key: "feas", label: "Technical feasibility", weight: 0.15, fn: techFeasibility },
  { key: "risk", label: "Risk manageability", weight: 0.15, fn: riskManageability },
  { key: "adopt", label: "Adoption readiness", weight: 0.1, fn: adoptionReadiness },
];

export function requiredGates(w: Workshop): Gate[] {
  return [
    { key: "sponsor", label: "Business sponsor identified", passed: has(w.sponsor) },
    { key: "baseline", label: "Baseline metric defined", passed: has(w.baseline) },
    { key: "target", label: "Target outcome defined", passed: has(w.target) },
    { key: "data", label: "Data source identified", passed: has(w.dataSources) },
    { key: "risklvl", label: "Risk level assigned", passed: !!w.impactIfWrong },
    { key: "review", label: "Human review decision made", passed: w.humanReview === "Yes" || w.humanReview === "No" },
  ];
}

function topRisks(w: Workshop): RiskItem[] {
  const out: RiskItem[] = [];
  if (w.impactIfWrong === "High" || w.impactIfWrong === "Critical") out.push({ label: `${w.impactIfWrong} impact if the AI is wrong, needs strong guardrails`, severity: "high" });
  if (w.regulatory === "High" || w.regulatory === "Unknown") out.push({ label: `Regulatory exposure is ${w.regulatory.toLowerCase()}, confirm compliance owner`, severity: "high" });
  if (["PII", "PHI", "PCI"].includes(w.dataSensitivity)) out.push({ label: `${w.dataSensitivity} data in scope, redaction & access controls required`, severity: "high" });
  if (w.freshnessConcern === "Yes") out.push({ label: "Source freshness is a concern, stale answers risk", severity: "med" });
  if (has(w.dataGaps)) out.push({ label: "Known data gaps could cap answer quality", severity: "med" });
  if (w.citationRequired === "Unsure" || w.citationRequired === "No") out.push({ label: "Citation/evidence not settled, trust & auditability risk", severity: "med" });
  if (w.aiPattern === "Agentic workflow") out.push({ label: "Agentic pattern, needs action approval & permission boundaries", severity: "med" });
  if (w.humanReview === "Unsure") out.push({ label: "Human in the loop decision unresolved", severity: "low" });
  return out.slice(0, 5);
}

export function scoreWorkshop(w: Workshop): Scored {
  const categories: CategoryScore[] = CATS.map((c) => ({ key: c.key, label: c.label, weight: c.weight, score: c.fn(w) }));
  const overall = clamp(categories.reduce((a, c) => a + c.score * c.weight, 0));
  const gates = requiredGates(w);
  const missingGates = gates.filter((g) => !g.passed).map((g) => g.label);
  const gatesPassed = missingGates.length === 0;

  let band: Band, recommendation: string;
  if (overall >= 80) { band = "go"; recommendation = "Proceed to Data Lab"; }
  else if (overall >= 65) { band = "refine"; recommendation = "Good candidate, refine assumptions"; }
  else if (overall >= 50) { band = "redesign"; recommendation = "Needs redesign before pilot"; }
  else { band = "stop"; recommendation = "Do not proceed yet"; }

  const weakest = [...categories].sort((a, b) => a.score - b.score)[0];
  let nextAction: string;
  if (!gatesPassed) nextAction = `Resolve required gates: ${missingGates.slice(0, 2).join(", ")}${missingGates.length > 2 ? "…" : ""}`;
  else if (band === "go") nextAction = "Confirm data ownership and PII handling, then hand off to the Data Lab.";
  else if (band === "refine") nextAction = `Strengthen ${weakest.label.toLowerCase()}, it's the weakest link at ${weakest.score}/100.`;
  else if (band === "redesign") nextAction = "Rework the value case and de-risk the highest-impact assumptions before piloting.";
  else nextAction = "Reframe the use case, the value or feasibility isn't there yet.";

  return { overall, categories, gates, gatesPassed, missingGates, band, recommendation, risks: topRisks(w), nextAction };
}

// ---- brief ------------------------------------------------------------------
export interface Brief {
  name: string; problem: string; users: string; outcome: string; baseline: string; target: string;
  pattern: string; dataSources: string; risks: string[]; controls: string[]; gates: Gate[];
  score: number; recommendation: string; nextStep: string;
}

const CONTROLS_BY_PATTERN: Record<string, string[]> = {
  "Search / knowledge assistant": ["Citation enforcement", "Source freshness checks", "Confidence threshold"],
  "Summarization": ["Human review", "PII redaction", "Summary quality checks"],
  "Classification": ["Confidence threshold", "Human review of low-confidence", "Bias monitoring"],
  "Recommendation": ["Evidence links", "Human approval", "Explainability"],
  "Decision support": ["Explainability", "Evidence links", "Human approval"],
  "Workflow automation": ["Step logging", "Action approval", "Rollback path"],
  "Agentic workflow": ["Permission boundaries", "Step logging", "Action approval"],
};

export function buildBrief(w: Workshop, s: Scored): Brief {
  const controls = new Set(CONTROLS_BY_PATTERN[w.aiPattern] ?? ["Human review", "Audit logging"]);
  if (w.auditTrail === "Yes") controls.add("Audit logs");
  if (w.citationRequired === "Yes") controls.add("Citation enforcement");
  if (w.escalationPath === "Yes") controls.add("Escalation workflow");
  if (["PII", "PHI", "PCI"].includes(w.dataSensitivity)) controls.add("Redaction & access controls");
  return {
    name: w.initiativeName || sharpenName(w),
    problem: w.painPoint || w.ambition || "N/A",
    users: w.targetUsers || "N/A",
    outcome: valueSentence(w),
    baseline: w.baseline || "N/A",
    target: w.target || "N/A",
    pattern: w.aiPattern || "N/A",
    dataSources: w.dataSources || "N/A",
    risks: s.risks.map((r) => r.label),
    controls: [...controls],
    gates: s.gates,
    score: s.overall,
    recommendation: s.recommendation,
    nextStep: s.nextAction,
  };
}

// ---- narrative generators ---------------------------------------------------
function sharpenName(w: Workshop): string {
  if (w.initiativeName) return w.initiativeName;
  const p = w.aiPattern === "Search / knowledge assistant" ? "Knowledge assistant" : w.aiPattern || "AI assistant";
  const who = w.targetUsers ? ` for ${w.targetUsers.toLowerCase()}` : "";
  return `${p}${who}`.slice(0, 70) || "AI initiative";
}
export function sharpenedProblem(w: Workshop): string {
  if (!w.ambition && !w.painPoint) return "";
  const pattern = w.aiPattern || "an AI capability";
  const who = w.targetUsers || "the target users";
  const driver = (w.valueDriver || "improve outcomes").toLowerCase();
  return `Deploy ${pattern.toLowerCase()} for ${who.toLowerCase()} to ${driver}${w.process ? ` across ${w.process.toLowerCase()}` : ""}, addressing: ${w.painPoint || w.ambition}.`;
}
export function valueSentence(w: Workshop): string {
  if (w.baseline && w.target) return `Move from ${w.baseline} to ${w.target}${w.timeHorizon ? ` within ${w.timeHorizon}` : ""}.`;
  return w.valueDriver ? `${w.valueDriver} for ${w.targetUsers || "the target users"}.` : "Define the target outcome to make this falsifiable.";
}
export function falsifiableTarget(w: Workshop): string {
  const horizon = w.timeHorizon || "90 days";
  if (w.baseline && w.target) {
    return `Within ${horizon}, move from ${w.baseline} to ${w.target}${w.usersImpacted ? ` for ${w.usersImpacted} users` : ""}, while keeping answer quality high.`;
  }
  // Partial data, still make it move with the driver, users, and horizon.
  const driver = (w.valueDriver || "a measurable improvement").toLowerCase();
  const who = w.targetUsers ? ` for ${w.targetUsers.toLowerCase()}` : "";
  const anchor = w.baseline ? ` from a baseline of ${w.baseline}` : w.target ? ` toward ${w.target}` : "";
  return `Within ${horizon}, deliver ${driver}${who}${anchor}, set a baseline and a dated target to make it fully testable.`;
}

// ---- auto-generate a full workshop from a picked idea -----------------------
// Turns the idea generator's (use case + 5 knobs + ambition) into a complete,
// coherent Workshop: every field filled with relevant content and an
// auto-generated falsifiable baseline→target. Deterministic per idea (seeded),
// so different picks yield different-but-stable numbers.
function seedRand(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function genMetrics(driver: string, rnd: () => number): { baseline: string; target: string } {
  const j = (base: number, pct = 0.15) => base * (1 + (rnd() * 2 - 1) * pct);
  switch (driver) {
    case "Cost reduction": { const b = j(4.2); return { baseline: `$${b.toFixed(2)} cost per interaction`, target: `$${(b * 0.62).toFixed(2)} cost per interaction` }; }
    case "Cycle-time reduction": { const b = Math.max(8, Math.round(j(18))); return { baseline: `${b} min average handling time`, target: `${Math.round(b * 0.5)} min average handling time` }; }
    case "Quality improvement": { const b = Math.round(j(71, 0.08)); return { baseline: `${b}% first contact resolution`, target: `${Math.min(95, b + 16)}% first contact resolution` }; }
    case "Revenue lift": { const b = j(1.8); return { baseline: `$${b.toFixed(1)}M influenced revenue / quarter`, target: `$${(b * 1.4).toFixed(1)}M influenced revenue / quarter` }; }
    case "Risk reduction": { const b = j(6.4, 0.2); return { baseline: `${b.toFixed(1)}% error rate`, target: `${(b * 0.3).toFixed(1)}% error rate` }; }
    case "Customer experience": { const b = j(3.6, 0.06); return { baseline: `CSAT ${b.toFixed(1)}/5`, target: `CSAT ${Math.min(4.8, b + 0.8).toFixed(1)}/5` }; }
    default: { const b = Math.round(j(70, 0.08)); return { baseline: `${b}% baseline`, target: `${Math.min(95, b + 15)}% target` }; }
  }
}

const JOB_PATTERN: Record<string, string> = {
  Answer: "Search / knowledge assistant", Summarize: "Summarization", Extract: "Classification",
  Classify: "Classification", Decide: "Decision support", Monitor: "Decision support",
  Generate: "Summarization", Orchestrate: "Agentic workflow",
};
const PAIN_DRIVER: Record<string, string> = {
  "Too slow": "Cycle-time reduction", "Inconsistent": "Quality improvement", "Too expensive": "Cost reduction",
  "Hard to scale": "Cost reduction", "Error prone": "Risk reduction", "Knowledge trapped": "Quality improvement",
  "Poor experience": "Customer experience", "Impossible today": "Revenue lift",
};
const POSTURE_STRUCT: Record<string, Workshop["dataStructure"]> = {
  "Rich & ready": "Structured", "Scattered": "Mixed", "Sparse": "Unstructured", "Unstructured": "Unstructured",
};
const USER_META: Record<string, { func: string; sponsor: string; facing: Workshop["facing"]; sens: Workshop["dataSensitivity"]; vol: number }> = {
  "Customers": { func: "Customer Support", sponsor: "VP, Customer Experience", facing: "Customer-facing", sens: "PII", vol: 1200 },
  "Employees": { func: "Operations", sponsor: "COO", facing: "Internal", sens: "Internal", vol: 900 },
  "Analysts": { func: "Analytics", sponsor: "Head of Analytics", facing: "Internal", sens: "Confidential", vol: 320 },
  "Frontline staff": { func: "Field Operations", sponsor: "VP, Field Operations", facing: "Internal", sens: "Internal", vol: 1100 },
  "Developers": { func: "Engineering", sponsor: "VP, Engineering", facing: "Internal", sens: "Internal", vol: 280 },
  "Executives": { func: "Strategy", sponsor: "Chief Strategy Officer", facing: "Internal", sens: "Confidential", vol: 120 },
  "Partners": { func: "Partnerships", sponsor: "VP, Partnerships", facing: "Customer-facing", sens: "Confidential", vol: 500 },
};
const PATTERN_SOURCES: Record<string, string> = {
  "Search / knowledge assistant": "Help-center articles, resolved tickets, product docs",
  "Summarization": "Transcripts, email threads, case notes, reports",
  "Classification": "Historical labeled records, intake forms, tags",
  "Decision support": "Historical outcomes, policy docs, CRM records",
  "Agentic workflow": "System APIs, workflow logs, runbooks, SOPs",
};
const PATTERN_ACTION: Record<string, string> = {
  "Search / knowledge assistant": "Surface a cited answer with source links",
  "Summarization": "Produce a reviewed summary draft",
  "Classification": "Assign a category with a confidence score",
  "Decision support": "Recommend an option with rationale and evidence",
  "Agentic workflow": "Draft and stage actions for human approval",
};
const SENS_REG: Record<string, Workshop["regulatory"]> = {
  Public: "None", Internal: "None", Confidential: "Moderate", PII: "Moderate", PHI: "High", PCI: "High",
};

export function generateWorkshop(uc: UseCase, p: FramingParams, ambition: string): Workshop {
  const rnd = seedRand(`${uc.title}|${p.user}|${p.job}|${p.pain}`);
  const aiPattern = JOB_PATTERN[p.job] ?? "Search / knowledge assistant";
  const valueDriver = PAIN_DRIVER[p.pain] ?? "Quality improvement";
  const um = USER_META[p.user] ?? USER_META["Customers"];
  const { baseline, target } = genMetrics(valueDriver, rnd);
  const freq = (JOBS as Record<string, { freq: number }>)[p.job]?.freq ?? 0.7;
  const frequency = freq >= 0.8 ? "Daily" : freq >= 0.6 ? "Several times a week" : "Weekly";
  const usersImpacted = String(um.vol + Math.round((rnd() * 2 - 1) * um.vol * 0.15));
  const verb = (JOBS as Record<string, { verb: string }>)[p.job]?.verb ?? "assist";
  const sparse = p.posture === "Sparse" || p.posture === "Unstructured";

  // --- context-derived categorical selections (drive the radio/chip choices) ---
  const sens = um.sens;
  const sensitive = sens === "PII" || sens === "PHI" || sens === "PCI";
  const hiTouch = aiPattern === "Decision support" || aiPattern === "Agentic workflow";
  const agentic = aiPattern === "Agentic workflow";
  const isKnowledge = aiPattern === "Search / knowledge assistant";
  const custFacing = um.facing === "Customer-facing";
  const rich = p.posture === "Rich & ready";
  const jobDiff = (JOBS as Record<string, { diff: number }>)[p.job]?.diff ?? 0.4;
  const painSev = (PAINS as Record<string, { sev: number }>)[p.pain]?.sev ?? 0.6;
  const regulatory = SENS_REG[sens] ?? "None";

  // Impact if the AI is wrong, a property of the use case, nudged by risk appetite.
  const appetitePts = p.risk === "Aggressive" ? 1 : p.risk === "Conservative" ? -1 : 0;
  const impactPts = (hiTouch ? 2 : 0) + (agentic ? 1 : 0) + (custFacing ? 1 : 0) + (sensitive ? 1 : 0) + (jobDiff > 0.7 ? 1 : 0) + appetitePts;
  const impactIfWrong: Impact = impactPts >= 5 ? "Critical" : impactPts >= 3 ? "High" : impactPts >= 1 ? "Medium" : "Low";
  const hiImpact = impactIfWrong === "High" || impactIfWrong === "Critical";

  // Controls follow the risk shape of the use case.
  const humanReview: YNU = (impactIfWrong === "Low" && (aiPattern === "Classification" || aiPattern === "Summarization")) ? "No" : "Yes";
  const freshnessConcern: YNU = ((p.job === "Answer" || p.job === "Monitor") && !rich) ? "Yes" : "No";
  const auditTrail: YNU = (regulatory !== "None" || hiImpact) ? "Yes" : "No";
  const citationRequired: YNU = (isKnowledge || hiTouch) ? "Yes" : "No";
  const escalationPath: YNU = (custFacing || hiImpact || agentic) ? "Yes" : "No";

  // Delivery complexity follows the pattern, data posture, and reach.
  const workflowChange: Lvl = (agentic || aiPattern === "Workflow automation") ? "High" : hiTouch ? "Medium" : "Low";
  const techPts = (agentic ? 2 : 0) + (hiTouch ? 1 : 0) + (sparse ? 1 : 0) + (jobDiff > 0.6 ? 1 : 0);
  const techDependency: Lvl = techPts >= 3 ? "High" : techPts >= 2 ? "Medium" : "Low";
  const adoptPts = (workflowChange === "High" ? 2 : workflowChange === "Medium" ? 1 : 0) + (custFacing ? 1 : 0) + (um.vol > 1000 ? 1 : 0);
  const adoptionComplexity: Lvl = adoptPts >= 3 ? "High" : adoptPts >= 2 ? "Medium" : "Low";
  const pilotUrgency: Lvl = painSev >= 0.85 ? "High" : painSev >= 0.65 ? "Medium" : "Low";

  return {
    initiativeName: uc.title,
    businessFunction: um.func,
    sponsor: um.sponsor,
    process: `${verb} ${p.user.toLowerCase()}`,
    painPoint: uc.desc || `Today, ${p.user.toLowerCase()} experience "${p.pain.toLowerCase()}" in this workflow.`,
    targetUsers: p.user,
    facing: um.facing,
    ambition,
    aiPattern,
    expectedAction: PATTERN_ACTION[aiPattern] ?? "Return a reviewed, cited response",
    humanReview,
    baseline,
    target,
    usersImpacted,
    frequency,
    valueDriver,
    timeHorizon: "90 days",
    dataSources: PATTERN_SOURCES[aiPattern] ?? "Existing operational records",
    dataOwner: `${um.func} data team`,
    dataSensitivity: sens,
    dataGaps: sparse ? "Coverage is thin in places, some records are unlabeled or missing." : "",
    freshnessConcern,
    dataStructure: POSTURE_STRUCT[p.posture] ?? "Mixed",
    impactIfWrong,
    regulatory,
    auditTrail,
    citationRequired,
    escalationPath,
    integrations: um.func === "Customer Support" ? "CRM, ticketing (Zendesk), knowledge base" : "Core system of record, SSO, data warehouse",
    workflowChange,
    techDependency,
    adoptionComplexity,
    pilotUrgency,
  };
}

// ---- map to ProgramState initiative (keeps downstream labs working) ---------
const PATTERN_JOB: Record<string, string> = {
  "Search / knowledge assistant": "Answer", "Summarization": "Summarize", "Classification": "Classify",
  "Recommendation": "Decide", "Decision support": "Decide", "Workflow automation": "Orchestrate", "Agentic workflow": "Orchestrate",
};
const DRIVER_SHAPE: Record<string, string> = {
  "Cost reduction": "Cut cost", "Cycle-time reduction": "Reduce time", "Quality improvement": "Improve quality",
  "Revenue lift": "Lift revenue", "Risk reduction": "Reduce risk", "Customer experience": "Improve experience",
};
const IMPACT_APPETITE: Record<string, string> = { Low: "Conservative", Medium: "Balanced", High: "Aggressive", Critical: "Aggressive" };

// ---- Strategy → initiative metadata (Phase 1) -------------------------------
const PATTERN_TAGS: Record<string, string[]> = {
  "Search / knowledge assistant": ["Prompting", "RAG", "Embeddings", "Vector database", "Retrieval", "Reranking", "Evaluation"],
  "Summarization": ["Prompting", "Summarization", "Evaluation"],
  "Classification": ["Classification", "Training data", "Evaluation"],
  "Recommendation": ["RAG", "Decision support", "Evaluation"],
  "Decision support": ["RAG", "Decision support", "Evaluation", "Governance"],
  "Workflow automation": ["Tool calling", "Agentic workflow", "Governance"],
  "Agentic workflow": ["Agentic workflow", "Tool calling", "RAG", "Governance"],
};
const PATTERN_BUILD_PATH: Record<string, BuildPathRecommendation> = {
  "Search / knowledge assistant": { path: "RAG knowledge assistant with governed retrieval and citation validation", why: "The use case depends on knowledge-base content, needs current source grounding, and has high risk if stale or unsupported answers are returned.", requiredStages: ["Data readiness", "Build/RAG evaluation", "Operate monitoring", "Govern audit evidence", "Realize ROI"] },
  "Summarization": { path: "Prompted summarization workflow with human review", why: "Summaries compress source material and must stay faithful; a review step catches drift and omission.", requiredStages: ["Data readiness", "Build/RAG evaluation", "Operate monitoring", "Govern review", "Realize ROI"] },
  "Classification": { path: "Classification / routing model with labeled data and evaluation", why: "A repeatable, high volume decision benefits from a trained classifier with a measured accuracy bar.", requiredStages: ["Training-data readiness", "Build evaluation", "Operate drift monitoring", "Govern review", "Realize ROI"] },
  "Recommendation": { path: "RAG decision-support assistant with evidence and human approval", why: "Recommendations influence outcomes and need traceable evidence plus a human decision point.", requiredStages: ["Data readiness", "Build/RAG evaluation", "Operate monitoring", "Govern approval", "Realize ROI"] },
  "Decision support": { path: "RAG decision-support assistant with evidence and human approval", why: "Advice used by staff must be grounded, explainable, and approved before action.", requiredStages: ["Data readiness", "Build/RAG evaluation", "Operate monitoring", "Govern approval", "Realize ROI"] },
  "Workflow automation": { path: "Governed agentic workflow with tool permissions and approvals", why: "Automated actions carry execution risk and need permission boundaries, approval gates, and an audit trail.", requiredStages: ["Data & tool contracts", "Build/agent evaluation", "Operate incident readiness", "Govern audit evidence", "Realize ROI"] },
  "Agentic workflow": { path: "Governed agentic workflow with tool permissions and approvals", why: "An agent that calls tools needs scoped permissions, action approvals, logging, and rollback.", requiredStages: ["Data & tool contracts", "Build/agent evaluation", "Operate incident readiness", "Govern audit evidence", "Realize ROI"] },
};

export function deriveInitiativeMeta(w: Workshop): InitiativeMeta {
  const pattern = w.aiPattern || "Search / knowledge assistant";
  const sensitive = w.dataSensitivity === "PII" || w.dataSensitivity === "PHI" || w.dataSensitivity === "PCI";
  const bumpReg = w.regulatory === "High" || w.regulatory === "Unknown";

  // Governance tier from impact-if-wrong, nudged up by regulatory / sensitive data.
  const order: GovernanceTier[] = ["Low", "Medium", "High", "Critical"];
  let ti = Math.max(0, order.indexOf((w.impactIfWrong || "Medium") as GovernanceTier));
  if (bumpReg || sensitive) ti = Math.min(order.length - 1, ti + 1);
  const governanceTier = order[ti];

  const hiImpact = w.impactIfWrong === "High" || w.impactIfWrong === "Critical";
  const custFacing = w.facing === "Customer-facing";
  const operationalCriticality: Criticality = (hiImpact && custFacing) || w.impactIfWrong === "Critical" ? "High" : hiImpact || custFacing ? "Medium" : "Low";

  const tags = [...(PATTERN_TAGS[pattern] ?? ["Prompting", "Evaluation"]), "AI Ops", "Governance", "Realize / ROI"];

  const rationaleBits: string[] = [];
  if (sensitive) rationaleBits.push(`${w.dataSensitivity} data in scope`);
  if (bumpReg) rationaleBits.push(`${(w.regulatory || "regulatory").toLowerCase()} regulatory exposure`);
  if (custFacing) rationaleBits.push("customer-facing output");
  if (hiImpact) rationaleBits.push(`${(w.impactIfWrong || "").toLowerCase()} impact if wrong`);
  const governanceTierRationale = rationaleBits.length ? `Tier ${governanceTier}: ${rationaleBits.join(", ")}.` : `Tier ${governanceTier} based on impact and exposure.`;

  return {
    primaryAiPattern: pattern,
    capabilityTags: Array.from(new Set(tags)),
    buildPathRecommendation: PATTERN_BUILD_PATH[pattern] ?? PATTERN_BUILD_PATH["Search / knowledge assistant"],
    governanceTier,
    governanceTierRationale,
    operationalCriticality,
    humanReviewRequired: w.humanReview === "Yes" || hiImpact,
    auditEvidenceRequired: w.auditTrail === "Yes" || (w.regulatory !== "None" && w.regulatory !== "") || sensitive,
  };
}

export function toInitiative(w: Workshop, s: Scored): Initiative {
  const value = s.categories.find((c) => c.key === "value")?.score ?? 60;
  const feas = s.categories.find((c) => c.key === "feas")?.score ?? 60;
  const data = s.categories.find((c) => c.key === "data")?.score ?? 60;
  const scope = w.workflowChange === "High" ? 0.7 : w.workflowChange === "Medium" ? 0.5 : 0.35;
  return {
    name: w.initiativeName || sharpenName(w),
    rawAmbition: w.ambition,
    sharpenedProblem: sharpenedProblem(w),
    params: {
      user: w.facing === "Customer-facing" ? "Customers" : "Employees",
      job: PATTERN_JOB[w.aiPattern] ?? "Answer",
      pain: w.painPoint,
      posture: w.dataStructure || "Mixed",
      risk: IMPACT_APPETITE[w.impactIfWrong] ?? "Balanced",
    },
    selectedUseCase: { id: 0, title: w.initiativeName || sharpenName(w), desc: w.painPoint, bucket: "Wins", value, effort: Math.round(100 - feas) },
    scope,
    successMetric: { shape: DRIVER_SHAPE[w.valueDriver] ?? "Improve quality", baseline: w.baseline, target: w.target, coverage: w.frequency || "core workflow" },
    scores: { value, feasibility: feas, dataReadiness: data },
    valueHypothesis: valueSentence(w),
    createdAt: new Date().toISOString(),
    meta: deriveInitiativeMeta(w),
  };
}
