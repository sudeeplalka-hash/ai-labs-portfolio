// @labs/kit · labs.ts, the lab route registry (single source of truth).
// labId → display name + route + collection. Both the Industry Atlas and the
// Storylines resolve labs through this, so a renamed route can't drift between them.

export interface LabRoute {
  name: string;
  href: string;
  collection: string;
}

export const LAB_ROUTES: Record<string, LabRoute> = {
  // Collection 1 · Enterprise AI Lifecycle (stages that storylines/atlas may reference)
  "C1-operate": { name: "Operate, Day Two Observability", href: "/operate", collection: "Enterprise AI Lifecycle" },
  // Collection 2 · Agent Architecture and Protocol Strategy Artifacts Engineering
  "GAP-01": { name: "MCP Server Contract Workbench", href: "/agents/mcp-playground", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-02": { name: "Agent Failure and Recovery Inspector", href: "/agents/loop-inspector", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-03": { name: "Multiagent Orchestration Economics Board", href: "/agents/orchestration", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-04": { name: "Structured Output Reliability Gate", href: "/agents/structured-output", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-05": { name: "Context and Memory Strategy Evaluator", href: "/agents/context-memory", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-06": { name: "Token Economics Simulator", href: "/agents/cost-simulator", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-07": { name: "Protocol Selection Decision Model", href: "/agents/protocol-selection", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  "GAP-08": { name: "Human Review and Autonomy Control Simulator", href: "/agents/hitl", collection: "Agent Architecture and Protocol Strategy Artifacts" },
  // Collection 3 · The AI Investment Strategy and Portfolio Governance
  "C3-1": { name: "AI Portfolio Capital Allocation Dashboard", href: "/business/portfolio", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-2": { name: "Build, Buy, or Fine Tune Decision Evaluator", href: "/business/build-buy", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-3": { name: "Inference Run Rate Forecaster", href: "/business/cost-forecaster", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-4": { name: "Vendor Selection and Concentration Risk Monitor", href: "/business/vendor-monitor", collection: "AI Investment Strategy and Portfolio Governance" },
  "C3-5": { name: "AI Business Case and ROI Builder", href: "/business/roi-builder", collection: "AI Investment Strategy and Portfolio Governance" },
  // Collection 4 · Operating Model and Transformation Leadership Artifacts
  "EL-01": { name: "Adoption Readiness Decision Instrument", href: "/engagement/adoption", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-02": { name: "Stakeholder and Sponsor Alignment Cockpit", href: "/engagement/stakeholders", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-03": { name: "Capacity and Skills Coverage Planner", href: "/engagement/capacity", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-04": { name: "Delivery Health and RAID Radar", href: "/engagement/raid-radar", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-05": { name: "AI Compliance Readiness Navigator", href: "/engagement/compliance", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-06": { name: "Talent and Upskilling Pathway Planner", href: "/engagement/talent", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-07": { name: "RFP and Bid Decision War Room", href: "/engagement/rfp", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-08": { name: "Estimation and Scope Control Studio", href: "/engagement/estimation", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-09": { name: "Onboarding and Knowledge Transfer Tracker", href: "/engagement/onboarding", collection: "Operating Model and Transformation Leadership Artifacts" },
  "EL-10": { name: "Executive Communication Decision Studio", href: "/engagement/exec-comms", collection: "Operating Model and Transformation Leadership Artifacts" },
};

// Build a deep-link into a lab, optionally pre-selecting a use case (?uc=).
export function labHref(labId: string, ucId?: string): string {
  const route = LAB_ROUTES[labId];
  if (!route) return "/";
  return ucId ? `${route.href}/?uc=${ucId}` : route.href;
}
