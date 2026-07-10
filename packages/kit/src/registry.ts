// labs-registry, the single source of truth for what exists, its status, and the
// decision it maps to. The Competency Map (§C0) and every collection index read
// from here, so shipping a lab (flipping status) updates the map automatically.
// C0 mechanics: "No claim without an evidence badge, if a row has none, delete it."

export type Collection = 0 | 1 | 2 | 3 | 4 | 5; // 5 = Live Builds (real models, real metrics)
export type LabStatus = "shipped" | "in-build" | "planned"; // ✅ / 🔨 / (backlog)
// Badge vocabulary (§C0 honesty): LIVE = real computation in the browser;
// SIMULATED = transparent deterministic logic, labeled as such; BYO-KEY = a
// real call made client-side with the reviewer's own key, nothing stored;
// RECORDED = a real execution captured and embedded, never dressed up as LIVE.
export type LiveMode = "LIVE" | "SIMULATED" | "BYO-KEY" | "RECORDED";
export type Priority = "P0" | "P1" | "P2";

export interface LabEntry {
  id: string; // "GAP-01", "EL-04", "C3-1", "C0", "C1"
  collection: Collection;
  title: string;
  status: LabStatus;
  live: LiveMode | null; // badge intent; null for meta/landing rows
  liveNote?: string; // e.g. "narrative generation may run LIVE"
  problem: string; // visitor-language problem line (§B3)
  decision: string; // the specific enterprise/engagement decision it maps to (§B3)
  priority?: Priority;
  flagship?: boolean;
  resumeEcho?: string; // Collection 4 only (§B3)
  href?: string;
}

export const STATUS_BADGE: Record<LabStatus, string> = {
  shipped: "✅",
  "in-build": "🔨",
  planned: "•",
};

// --- The catalog: 23 in-site labs + Layer 0 + Collection 1 (shipped spine) + Collection 5 standalone Live Builds ---
export const LABS: LabEntry[] = [
  // Layer 0
  {
    id: "C0", collection: 0, title: "Competency Map (Command Center)", status: "planned", live: null,
    problem: "Is this one person with unusual range, or four disconnected galleries?",
    decision: "Frames the whole portfolio: one operator across four altitudes.",
    href: "/",
  },

  // Collection 1, Enterprise AI Lifecycle (live spine; §A3, do not rebuild)
  {
    id: "C1", collection: 1, title: "Enterprise AI Lifecycle (spine)", status: "shipped", live: "LIVE",
    problem: "Can this person run an AI program end to end, with gates?",
    decision: "FRAME → DATA → BUILD(RAG) → DEPLOY → GOVERN & REALIZE, gated.",
    href: "/frame",
  },
  {
    id: "C1-backlog", collection: 1, title: "Backlog Generator", status: "shipped", live: "LIVE",
    problem: "Turn business requirements into user stories with backlog hygiene.",
    decision: "Requirements → sequenced, estimable backlog.", href: "/frame",
  },
  {
    id: "C1-rag", collection: 1, title: "RAG Quality Evaluator", status: "shipped", live: "LIVE",
    problem: "Does retrieval + generation actually stay faithful and cite sources?",
    decision: "Score faithfulness/citations/hallucination before trusting a RAG build.", href: "/build",
  },
  {
    id: "C1-corpus", collection: 1, title: "Corpus Intelligence, readiness board to measured cleanup", status: "shipped", live: "LIVE",
    problem: "Is this document corpus actually fit to feed a RAG system?",
    decision: "Score every guideline, resolve duplicates and stale versions, confirm topics, and measure the retrieval-quality effect of the cleanup, before Build ingests a single chunk.",
    href: "/data/corpus",
  },
  {
    id: "C1-govern", collection: 1, title: "Govern, guardrails & risk tiering", status: "shipped", live: "SIMULATED",
    problem: "Which use cases need which controls before they ship?",
    decision: "Risk tier a use case; map required guardrails.", href: "/govern",
  },
  {
    id: "C1-operate", collection: 1, title: "Operate, Day Two Observability", status: "shipped", live: "SIMULATED",
    problem: "Is the system still working, and what do we do when it isn't?",
    decision: "Retrain / reindex / rollback / rescope, triggered by the right signal, the loop back to Frame.",
    href: "/operate",
  },

  // Collection 2, Agent & Protocol Labs (toolkit)
  {
    id: "GAP-01", collection: 2, title: "MCP Server Contract Workbench", status: "shipped", live: "SIMULATED", priority: "P0",
    problem: "What actually goes over the wire when an agent calls a tool?",
    decision: "Expose N internal systems via MCP vs bespoke integrations, the crossover.",
    href: "/agents/mcp-playground",
  },
  {
    id: "GAP-02", collection: 2, title: "Agent Failure and Recovery Inspector", status: "shipped", live: "SIMULATED", priority: "P1",
    problem: "How do agents fail, and what catches it?",
    decision: "How much to budget for the observability harness around agents.",
    href: "/agents/loop-inspector",
  },
  {
    id: "GAP-03", collection: 2, title: "Multiagent Orchestration Economics Board", status: "shipped", live: "SIMULATED", liveNote: "LIVE ready, flips to LIVE when the host model endpoint is configured", priority: "P0", flagship: true,
    problem: "Is multiagent worth the extra cost, or a party trick?",
    decision: "When multiagent's quality gain justifies its cost multiplier.",
    href: "/agents/orchestration",
  },
  {
    id: "GAP-04", collection: 2, title: "Structured Output Reliability Gate", status: "shipped", live: "SIMULATED", liveNote: "LIVE ready, flips to LIVE when the host model endpoint is configured", priority: "P1",
    problem: "How do messy inputs become schema valid outputs, reliably?",
    decision: "Where to place the validation gate before outputs hit systems of record.",
    href: "/agents/structured-output",
  },
  {
    id: "GAP-05", collection: 2, title: "Context and Memory Strategy Evaluator", status: "shipped", live: "SIMULATED", priority: "P2",
    problem: "Which context strategy, dump, summarize, compress, hand off?",
    decision: "Set the cost fidelity dial per use case, not per platform.",
    href: "/agents/context-memory",
  },
  {
    id: "GAP-06", collection: 2, title: "Token Economics Simulator", status: "shipped", live: "SIMULATED", priority: "P1",
    problem: "What will this actually cost per month at volume?",
    decision: "Build vs buy on unit economics before architecture.",
    href: "/agents/cost-simulator",
  },
  {
    id: "GAP-07", collection: 2, title: "Protocol Selection Decision Model", status: "shipped", live: "SIMULATED", priority: "P0", flagship: true,
    problem: "Function calling, MCP, A2A, or hybrid for this integration?",
    decision: "The number of producers and consumers picks the protocol.",
    href: "/agents/protocol-selection",
  },
  {
    id: "GAP-08", collection: 2, title: "Human Review and Autonomy Control Simulator", status: "shipped", live: "SIMULATED", priority: "P1",
    problem: "How much autonomy before an edge case slips through?",
    decision: "Set autonomy level per risk tier, not per enthusiasm.",
    href: "/agents/hitl",
  },

  // Collection 3, Business of AI Delivery (gallery)
  {
    id: "C3-1", collection: 3, title: "AI Portfolio Capital Allocation Dashboard", status: "shipped", live: "SIMULATED", flagship: true,
    problem: "Which initiatives to kill, scale, or hold this quarter?",
    decision: "Portfolio kill/scale/hold via risk adjusted ROI thresholds.",
    href: "/business/portfolio",
  },
  {
    id: "C3-2", collection: 3, title: "Build, Buy, or Fine Tune Decision Evaluator", status: "shipped", live: "SIMULATED",
    problem: "Build it, buy it, or fine tune it?",
    decision: "3-year TCO across all three, with the flip condition.",
    href: "/business/build-buy",
  },
  {
    id: "C3-3", collection: 3, title: "Inference Run Rate Forecaster", status: "shipped", live: "SIMULATED",
    problem: "When does self hosting undercut API spend?",
    decision: "The API vs self host crossover, driven by utilization assumptions.",
    href: "/business/cost-forecaster",
  },
  {
    id: "C3-4", collection: 3, title: "Vendor Selection and Concentration Risk Monitor", status: "shipped", live: "SIMULATED",
    problem: "Which vendor, and what does concentration cost if we're wrong?",
    decision: "Weighted vendor pick + concentration/exit cost exposure.",
    href: "/business/vendor-monitor",
  },
  {
    id: "C3-5", collection: 3, title: "AI Business Case and ROI Builder", status: "shipped", live: "SIMULATED", flagship: true,
    problem: "What's the payback, and how fragile is it?",
    decision: "Fund/defer on an NPV range, not a single point.",
    href: "/business/roi-builder",
  },

  // Collection 4, Engagement Leadership Labs (control room, two wings)
  {
    id: "EL-01", collection: 4, title: "Adoption Readiness Decision Instrument", status: "shipped", live: "SIMULATED", priority: "P0", flagship: true,
    problem: "Are the people ready, or just the model?",
    decision: "Scale / scale with conditions / hold the rollout.",
    resumeEcho: "Gen AI rollouts at AMEX; the adoption half of the 4.5× scale story.",
    href: "/engagement/adoption",
  },
  {
    id: "EL-02", collection: 4, title: "Stakeholder and Sponsor Alignment Cockpit", status: "shipped", live: "SIMULATED", priority: "P1",
    problem: "Which sponsor is quietly drifting before the next steering?",
    decision: "Who needs to hear what, from whom, before the meeting.",
    resumeEcho: "Multi stakeholder consulting delivery (Deloitte/Verizon, Genpact/Morgan Stanley).",
    href: "/engagement/stakeholders",
  },
  {
    id: "EL-03", collection: 4, title: "Capacity and Skills Coverage Planner", status: "shipped", live: "SIMULATED", priority: "P0",
    problem: "Do 30 people actually cover this portfolio's skills?",
    decision: "Hire / contract / upskill per gap, with date + cost impact.",
    resumeEcho: "Direct mirror of the 31-resource AMEX intelligence mapping, the most personal lab on the site.",
    href: "/engagement/capacity",
  },
  {
    id: "EL-04", collection: 4, title: "Delivery Health and RAID Radar", status: "shipped", live: "SIMULATED", liveNote: "status narrative may run LIVE", priority: "P1",
    problem: "Which 'green' workstream is actually trending into trouble?",
    decision: "Report trajectory, not snapshot, surface the reported vs actual gap.",
    resumeEcho: "The weekly reality of multi portfolio EM work at AMEX.",
    href: "/engagement/raid-radar",
  },
  {
    id: "EL-05", collection: 4, title: "AI Compliance Readiness Navigator", status: "shipped", live: "SIMULATED", priority: "P1",
    problem: "What tier is this AI, and what controls does it owe?",
    decision: "Risk tier + required controls map (EU AI Act + finserv overlays).",
    resumeEcho: "Regulated industry delivery, AMEX, Morgan Stanley, S&P/CRISIL.",
    href: "/engagement/compliance",
  },
  {
    id: "EL-06", collection: 4, title: "Talent and Upskilling Pathway Planner", status: "shipped", live: "SIMULATED", priority: "P2",
    problem: "How do we get the team to agentic era skills in time?",
    decision: "Build/hire/partner pathway per role, with time to productive.",
    resumeEcho: "Team capability building across delivery portfolios.",
    href: "/engagement/talent",
  },
  {
    id: "EL-07", collection: 4, title: "RFP and Bid Decision War Room", status: "shipped", live: "SIMULATED", liveNote: "requirement extraction may run LIVE", priority: "P1",
    problem: "Should we even bid this, and where's the response weak?",
    decision: "Bid / no bid as a portfolio decision (fit × win prob × capacity × margin).",
    resumeEcho: "$9M pipeline, the instrument of how a pipeline gets built, one qualified pursuit at a time.",
    href: "/engagement/rfp",
  },
  {
    id: "EL-08", collection: 4, title: "Estimation and Scope Control Studio", status: "shipped", live: "SIMULATED", priority: "P1",
    problem: "What's the real estimate, and what happens when scope moves?",
    decision: "Deliverable estimate range + staffing + change control impact.",
    resumeEcho: "Consulting delivery estimation across HCLTech/Genpact/Deloitte.",
    href: "/engagement/estimation",
  },
  {
    id: "EL-09", collection: 4, title: "Onboarding and Knowledge Transfer Tracker", status: "shipped", live: "SIMULATED", priority: "P2",
    problem: "Why does it take 40 days to make a new hire productive?",
    decision: "Onboarding critical path + KT capture before senior roll off.",
    resumeEcho: "Resource lead reality of the 31 resource AMEX portfolio; onshore/offshore mobilization.",
    href: "/engagement/onboarding",
  },
  {
    id: "EL-10", collection: 4, title: "Executive Communication Decision Studio", status: "shipped", live: "SIMULATED", liveNote: "per section talk track may run LIVE", priority: "P1",
    problem: "Does this exec update force a decision, or just report status?",
    decision: "What decision to force this week, framed per audience.",
    resumeEcho: "Weekly leadership updates and QBRs across multiple AMEX portfolios.",
    href: "/engagement/exec-comms",
  },

  // Collection 5, Live Builds (real models, real metrics; standalone deploys).
  // Doctrine: entries land here only when the deploy is verified live.
  {
    id: "LB-01", collection: 5, title: "Enterprise AI Governance Control Plane", status: "shipped", live: "LIVE",
    liveNote: "fully static in-browser engine (guardrails, risk scoring, audit chain); optional FastAPI service",
    problem: "Can we prove to an auditor that the guardrails actually ran?",
    decision: "Which guardrails gate which risk tier, and what a tamper-evident audit trail must capture.",
    flagship: true,
    href: "https://ai-governance-control-plane.vercel.app",
  },
  {
    id: "LB-03", collection: 5, title: "Model Evaluation & Threshold Economics", status: "shipped", live: "LIVE",
    liveNote: "trains a logistic model in your browser on a disclosed synthetic corpus; ROC/PR/calibration/cost curves all computed live",
    problem: "The model scores 0.91 AUC. So where do we set the threshold, in dollars?",
    decision: "Pick the operating point from the cost curve (review cost vs fraud loss), not from the leaderboard metric.",
    priority: "P0",
    href: "/builds/eval-bench",
  },
  {
    id: "LB-02", collection: 5, title: "RAG Quality Evaluator (live lab)", status: "shipped", live: "LIVE",
    liveNote: "deterministic evaluator runs in-browser; BYO-key live lab calls your model client-side, nothing stored",
    problem: "Is this RAG answer grounded, cited, and safe to trust?",
    decision: "Gate a RAG build on measured faithfulness, citation accuracy, and hallucination risk.",
    flagship: true,
    href: "https://rag-quality-evaluator.vercel.app",
  },
  {
    id: "LB-07", collection: 5, title: "labs-catalog MCP server (real wire session)", status: "shipped", live: "RECORDED",
    liveNote: "a working MCP server over this very registry; the repo ships an actual captured JSON-RPC session (tee-wire tap), regenerable with npm run capture",
    problem: "GAP-01 simulates the MCP wire protocol. What does a real session actually look like?",
    decision: "Expose an internal catalog via MCP: three tools, one server file, and the observable wire shape of each call.",
    href: "https://github.com/sudeeplalka-hash/labs-catalog-mcp",
  },
];

// --- Five domains of the Competency Map (§C0) ---
export interface Domain {
  id: string;
  title: string;
  claim: string;
  labIds: string[]; // evidence: shipped/in-build labs
  engagementEvidence: string[]; // 💼
  credentialIds?: string[]; // 🎓
}

export const DOMAINS: Domain[] = [
  {
    id: "agentic-protocol", title: "Agentic & Protocol Engineering",
    claim: "Reads the wire, MCP, A2A, agent loops, structured output.",
    labIds: ["GAP-01", "GAP-02", "GAP-03", "GAP-04", "GAP-05", "GAP-06", "GAP-07", "GAP-08"],
    engagementEvidence: ["Gen AI platform work (LLM/RAG/agentic) at AMEX"],
  },
  {
    id: "program-delivery", title: "AI Program Delivery & Governance",
    claim: "Runs the governed lifecycle, gate by gate, and the day two loop after it.",
    labIds: ["C1", "C1-backlog", "C1-rag", "C1-corpus", "C1-govern", "C1-operate"],
    engagementEvidence: ["Multi-portfolio AI delivery at AMEX", "4.5× portfolio scale"],
  },
  {
    id: "business-of-ai", title: "Business of AI / Capital Allocation",
    claim: "Runs AI as a P&L, allocation, TCO, vendor judgment.",
    labIds: ["C3-1", "C3-2", "C3-3", "C3-4", "C3-5"],
    engagementEvidence: ["$4M+ cost avoidance", "portfolio P&L ownership"],
  },
  {
    id: "engagement-leadership", title: "Engagement Leadership",
    claim: "Leads the humans: pursuit → mobilization → operations.",
    labIds: ["EL-01", "EL-02", "EL-03", "EL-04", "EL-05", "EL-06", "EL-07", "EL-08", "EL-09", "EL-10"],
    engagementEvidence: ["$9M pipeline", "31-resource intelligence mapping", "weekly exec reporting"],
  },
  {
    id: "foundations", title: "Foundations & Credentials",
    claim: "Regulated industry delivery, credentialed.",
    labIds: [],
    engagementEvidence: ["finserv (AMEX/Morgan Stanley/CRISIL-S&P)", "telecom (Verizon)", "consulting delivery model"],
    credentialIds: ["mba", "pmp", "aws-sa", "architect"],
  },
];

export interface Credential {
  id: string;
  label: string;
}
export const CREDENTIALS: Credential[] = [
  { id: "mba", label: "STEM MBA, AI & Quant, UT Austin McCombs" },
  { id: "pmp", label: "PMP" },
  { id: "aws-sa", label: "AWS Solutions Architect" },
  { id: "architect", label: "Licensed Architect" },
];

// Proof points woven into sample data / card copy (§A1).
export const PROOF_POINTS = [
  "$9M pipeline", "$4M+ cost avoidance", "4.5× portfolio scale",
  "31-resource intelligence mapping (AMEX)", "Gen AI platform (LLM/RAG/agentic)",
] as const;

// --- Selectors ---
export const labsByCollection = (c: Collection): LabEntry[] => LABS.filter((l) => l.collection === c && !["C0", "C1"].includes(l.id));
export const labById = (id: string): LabEntry | undefined => LABS.find((l) => l.id === id);
export const shippedLabs = (): LabEntry[] => LABS.filter((l) => l.status === "shipped");
export const liveShippedCount = (): number => LABS.filter((l) => l.status === "shipped" && l.live === "LIVE").length;

// Count the catalog labs (Collections 2 to 5); exclude Layer 0 and every
// Collection-1 row (spine + instruments) so the ratio can never miscount.
const isCatalogLab = (l: LabEntry) => l.collection >= 2;
export function progress(): { shipped: number; inBuild: number; planned: number; total: number } {
  const labs = LABS.filter(isCatalogLab);
  return {
    shipped: labs.filter((l) => l.status === "shipped").length,
    inBuild: labs.filter((l) => l.status === "in-build").length,
    planned: labs.filter((l) => l.status === "planned").length,
    total: labs.length,
  };
}
