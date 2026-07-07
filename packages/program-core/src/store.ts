import type { ProgramState, PortfolioEntry } from "./types";

export const STATE_KEY = "apcc_state";
export const PORTFOLIO_KEY = "apcc_portfolio";
export const MODE_KEY = "apcc_mode";

export function blankState(): ProgramState {
  return {
    initiative: {
      name: null,
      rawAmbition: "",
      sharpenedProblem: null,
      params: null,
      selectedUseCase: null,
      scope: 0.5,
      successMetric: null,
      scores: { value: 0, feasibility: 0, dataReadiness: 0 },
      valueHypothesis: null,
      createdAt: null,
    },
    // All stages browsable by default, visitors can explore any lab without
    // completing Framing first. (Framing still threads the initiative through.)
    progress: { frame: "active", data: "active", build: "active", deploy: "active", govern: "active", realize: "active", operate: "active" },
  };
}

// ---- Demo archetypes ----------------------------------------------------------
// Six curated, self-contained initiatives for Demo mode, one per use case
// archetype, so a visitor can shuffle through the product's range. Each variant
// carries its own initiative.meta, which the deterministic engines turn into a
// genuinely different program: the agentic archetype enables the agent layer,
// the classification archetype makes training readiness required, the
// decision-support archetype triggers human review and blocked sources, and the
// at-risk archetype shows what "not fundable yet" looks like.

export type DemoArchetype =
  | "knowledge-assistant" | "summarization" | "classification"
  | "decision-support" | "agentic-workflow" | "at-risk";

export const DEMO_ARCHETYPE_KEY = "apcc_demo_archetype";

export const DEMO_ARCHETYPES: { id: DemoArchetype; label: string; blurb: string }[] = [
  { id: "knowledge-assistant", label: "Knowledge assistant", blurb: "Customer answers from your own knowledge base, the clean, fundable RAG story." },
  { id: "summarization", label: "Summarization", blurb: "Meeting & case summarization, prompting first, with a citation gate failing." },
  { id: "classification", label: "Classification", blurb: "Claims intake routing, labeled data, training readiness, and generalization risk." },
  { id: "decision-support", label: "Decision support", blurb: "High stakes recommendations, human review, audit evidence, blocked sources." },
  { id: "agentic-workflow", label: "Agentic workflow", blurb: "Tool calling support agent, approvals, permission boundaries, blocked actions." },
  { id: "at-risk", label: "At risk initiative", blurb: "What bad looks like: weak data, failing gates, and a business case that doesn't clear." },
];

export function demoState(archetype: DemoArchetype = "knowledge-assistant"): ProgramState {
  const base: ProgramState = {
    initiative: {
      name: "Customer answer assistant",
      rawAmbition: "Help customers get instant, accurate answers to their most common questions.",
      sharpenedProblem:
        "Answer the top repeat customer questions instantly from our own knowledge base, so the waiting goes away. Prove it with one number: median time to a correct answer.",
      params: { user: "Customers", job: "Answer", pain: "Too slow", posture: "Scattered", risk: "Balanced" },
      selectedUseCase: { id: 0, title: "A quick answer assistant for customers", bucket: "Wins", value: 74, effort: 38 },
      scope: 0.4,
      successMetric: { shape: "Reduce time", baseline: "8 hrs", target: "under 2 hrs", coverage: "60% of customer requests" },
      scores: { value: 78, feasibility: 74, dataReadiness: 72 },
      valueHypothesis: "Faster, consistent answers lift self service and cut handle time.",
      createdAt: "2026-01-01T00:00:00.000Z",
      meta: {
        primaryAiPattern: "Search / knowledge assistant",
        capabilityTags: ["Retrieval", "Citations"],
        governanceTier: "Low",
        governanceTierRationale: "Read only answers over public product knowledge; low blast radius.",
        operationalCriticality: "Medium",
        humanReviewRequired: false,
        auditEvidenceRequired: false,
      },
    },
    data: { readinessScore: 74, gaps: 2, status: "ready" },
    rag: {
      faithfulness: 88, citationAccuracy: 90, hallucination: 5, costPerAnswer: 0.02, status: "good",
      model: "Frontier hosted, fast / mini", modelDeployment: "Hosted API",
      modelCostNote: "Low to moderate $/query", modelLatencyNote: "Fast",
      modelCostFactor: 0.7, modelLatencyFactor: 0.7, modelCapability: 80,
    },
    deploy: {
      costPerQuery: 0.06, monthlyCostAtTarget: 24000, latencyP95: 1400, latencyP99: 2100,
      reliability: 0.997, errorBudgetPct: 60, driftRisk: 30, status: "healthy",
    },
    governance: { riskTier: "Medium", controls: 8, status: "ok" },
    outcomes: { roi: 180, adoption: 0.62, riskAdjustedValue: 2400000, paybackMonths: 8 },
    progress: { frame: "done", data: "done", build: "done", deploy: "done", govern: "done", realize: "done", operate: "done" },
  };

  switch (archetype) {
    case "summarization":
      return {
        ...base,
        initiative: {
          ...base.initiative,
          name: "Meeting intelligence summarizer",
          rawAmbition: "Turn every customer meeting into a crisp, shareable summary with action items.",
          sharpenedProblem: "Summarize account meetings into decisions, risks, and next steps within five minutes of the call ending. Prove it with one number: minutes from call end to a usable summary.",
          params: { user: "Employees", job: "Summarize", pain: "Too slow", posture: "Rich & ready", risk: "Balanced" },
          selectedUseCase: { id: 1, title: "Meeting summaries for account teams", bucket: "Wins", value: 66, effort: 30 },
          successMetric: { shape: "Reduce time", baseline: "45 min", target: "under 5 min", coverage: "80% of account meetings" },
          scores: { value: 70, feasibility: 80, dataReadiness: 76 },
          valueHypothesis: "Consistent summaries free selling time and stop follow ups falling through.",
          meta: {
            primaryAiPattern: "Summarization",
            capabilityTags: ["Summarization", "Prompting"],
            governanceTier: "Low",
            governanceTierRationale: "Internal summaries reviewed by their own authors; low external exposure.",
            operationalCriticality: "Low",
            humanReviewRequired: false,
            auditEvidenceRequired: false,
          },
        },
        data: { readinessScore: 76, gaps: 1, status: "ready" },
        rag: { ...base.rag, faithfulness: 90, citationAccuracy: 82, hallucination: 7, costPerAnswer: 0.015 },
        outcomes: { roi: 120, adoption: 0.7, riskAdjustedValue: 1300000, paybackMonths: 11 },
      };

    case "classification":
      return {
        ...base,
        initiative: {
          ...base.initiative,
          name: "Claims intake classifier",
          rawAmbition: "Route incoming claims to the right queue automatically instead of triaging by hand.",
          sharpenedProblem: "Classify inbound claims into the correct handling queue at intake, so specialists start on the right work immediately. Prove it with one number: percent of claims routed correctly first time.",
          params: { user: "Employees", job: "Classify", pain: "Error prone", posture: "Rich & ready", risk: "Conservative" },
          selectedUseCase: { id: 2, title: "Automatic claims routing", bucket: "Core", value: 72, effort: 48 },
          successMetric: { shape: "Reduce errors", baseline: "18% misrouted", target: "under 6%", coverage: "all inbound claims" },
          scores: { value: 76, feasibility: 70, dataReadiness: 78 },
          valueHypothesis: "Right first time routing cuts rework and shortens claim cycle time.",
          meta: {
            primaryAiPattern: "Classification",
            capabilityTags: ["Classification", "Training data"],
            governanceTier: "Medium",
            governanceTierRationale: "Automated routing affects customer outcomes; misroutes are recoverable but costly.",
            operationalCriticality: "Medium",
            humanReviewRequired: false,
            auditEvidenceRequired: true,
          },
        },
        data: { readinessScore: 78, gaps: 2, status: "ready" },
        rag: { ...base.rag, faithfulness: 86, citationAccuracy: 88, hallucination: 8, costPerAnswer: 0.008 },
        outcomes: { roi: 210, adoption: 0.75, riskAdjustedValue: 2900000, paybackMonths: 6 },
      };

    case "decision-support":
      return {
        ...base,
        initiative: {
          ...base.initiative,
          name: "Care pathway decision support",
          rawAmbition: "Help case managers pick the right care pathway with evidence in front of them.",
          sharpenedProblem: "Recommend a care pathway with cited policy evidence for every case, decided by a human. Prove it with one number: percent of recommendations accepted without rework.",
          params: { user: "Frontline staff", job: "Decide", pain: "Inconsistent", posture: "Scattered", risk: "Conservative" },
          selectedUseCase: { id: 3, title: "Evidence backed pathway recommendations", bucket: "Differentiators", value: 82, effort: 60 },
          successMetric: { shape: "Reduce errors", baseline: "22% rework", target: "under 10%", coverage: "all managed cases" },
          scores: { value: 84, feasibility: 62, dataReadiness: 64 },
          valueHypothesis: "Consistent, evidence backed decisions reduce rework and escalations.",
          meta: {
            primaryAiPattern: "Decision support",
            capabilityTags: ["Retrieval", "Decision support"],
            governanceTier: "High",
            governanceTierRationale: "Recommendations influence care decisions, human review and audit evidence are mandatory.",
            operationalCriticality: "High",
            humanReviewRequired: true,
            auditEvidenceRequired: true,
          },
        },
        data: { readinessScore: 64, gaps: 4, status: "watch" },
        rag: { ...base.rag, faithfulness: 87, citationAccuracy: 89, hallucination: 9, costPerAnswer: 0.03 },
        deploy: { ...base.deploy, driftRisk: 45, status: "watch" },
        governance: { riskTier: "High", controls: 12, status: "review" },
        outcomes: { roi: 95, adoption: 0.55, riskAdjustedValue: 1800000, paybackMonths: 14 },
      };

    case "agentic-workflow":
      return {
        ...base,
        initiative: {
          ...base.initiative,
          name: "Support operations agent",
          rawAmbition: "Let an agent handle the routine support workflow end to end, safely.",
          sharpenedProblem: "Run the eligibility check and draft workflow with tools, where every risky action needs approval and nothing external executes unreviewed. Prove it with one number: minutes of handling time per resolved case.",
          params: { user: "Employees", job: "Orchestrate", pain: "Hard to scale", posture: "Rich & ready", risk: "Balanced" },
          selectedUseCase: { id: 4, title: "Governed support workflow agent", bucket: "Differentiators", value: 80, effort: 65 },
          successMetric: { shape: "Reduce time", baseline: "22 min/case", target: "under 8 min", coverage: "70% of routine cases" },
          scores: { value: 80, feasibility: 64, dataReadiness: 70 },
          valueHypothesis: "Tool using automation absorbs routine volume while approvals keep risk bounded.",
          meta: {
            primaryAiPattern: "Agentic workflow",
            capabilityTags: ["Agentic workflow", "Tool calling", "Retrieval"],
            governanceTier: "High",
            governanceTierRationale: "The agent proposes real actions, permission boundaries and approval gates are load bearing.",
            operationalCriticality: "High",
            humanReviewRequired: true,
            auditEvidenceRequired: true,
          },
        },
        data: { readinessScore: 70, gaps: 3, status: "ready" },
        rag: { ...base.rag, faithfulness: 87, citationAccuracy: 89, hallucination: 8, costPerAnswer: 0.04 },
        deploy: { ...base.deploy, costPerQuery: 0.09, monthlyCostAtTarget: 36000, driftRisk: 38 },
        governance: { riskTier: "High", controls: 14, status: "review" },
        outcomes: { roi: 240, adoption: 0.6, riskAdjustedValue: 3400000, paybackMonths: 7 },
      };

    case "at-risk":
      return {
        ...base,
        initiative: {
          ...base.initiative,
          name: "Legacy policy migration assistant",
          rawAmbition: "Answer questions from two decades of unversioned policy documents.",
          sharpenedProblem: "Answer policy questions from the legacy archive, but the archive is stale, unowned, and unlabeled. Prove it with one number: percent of answers a reviewer signs off.",
          params: { user: "Employees", job: "Answer", pain: "Knowledge trapped", posture: "Unstructured", risk: "Aggressive" },
          selectedUseCase: { id: 5, title: "Legacy archive Q&A", bucket: "Foundations", value: 55, effort: 70 },
          successMetric: { shape: "Reduce time", baseline: "3 days", target: "under 1 day", coverage: "40% of policy queries" },
          scores: { value: 58, feasibility: 48, dataReadiness: 42 },
          valueHypothesis: "If the archive can be trusted, research time collapses, a big if.",
          meta: {
            primaryAiPattern: "Search / knowledge assistant",
            capabilityTags: ["Retrieval"],
            governanceTier: "High",
            governanceTierRationale: "Unowned, stale sources with unknown sensitivity, high provenance risk.",
            operationalCriticality: "Medium",
            humanReviewRequired: true,
            auditEvidenceRequired: true,
          },
        },
        data: { readinessScore: 48, gaps: 7, status: "at-risk" },
        rag: { ...base.rag, faithfulness: 81, citationAccuracy: 78, hallucination: 14, costPerAnswer: 0.05, status: "watch" },
        deploy: { ...base.deploy, driftRisk: 65, errorBudgetPct: 25, status: "watch" },
        governance: { riskTier: "High", controls: 6, status: "review" },
        outcomes: { roi: 20, adoption: 0.35, riskAdjustedValue: 260000, paybackMonths: 34 },
      };

    case "knowledge-assistant":
    default:
      return base;
  }
}

export function loadState(): ProgramState {
  if (typeof window === "undefined") return blankState();
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? { ...blankState(), ...(JSON.parse(raw) as ProgramState) } : blankState();
  } catch {
    return blankState();
  }
}

export function saveState(s: ProgramState) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

export function loadPortfolio(): PortfolioEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_KEY);
    return raw ? (JSON.parse(raw) as PortfolioEntry[]) : [];
  } catch {
    return [];
  }
}

export function savePortfolio(list: PortfolioEntry[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
