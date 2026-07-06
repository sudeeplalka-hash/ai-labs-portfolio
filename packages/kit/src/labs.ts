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
  // Collection 2 · Agent & Protocol Engineering
  "GAP-01": { name: "MCP Server Playground", href: "/agents/mcp-playground", collection: "Agent & Protocol" },
  "GAP-02": { name: "Agent Loop & Failure Inspector", href: "/agents/loop-inspector", collection: "Agent & Protocol" },
  "GAP-03": { name: "Multiagent Orchestration Board", href: "/agents/orchestration", collection: "Agent & Protocol" },
  "GAP-04": { name: "Tool use & Structured Output", href: "/agents/structured-output", collection: "Agent & Protocol" },
  "GAP-05": { name: "Context & Memory Engineering", href: "/agents/context-memory", collection: "Agent & Protocol" },
  "GAP-06": { name: "Prompt Cost & Token Simulator", href: "/agents/cost-simulator", collection: "Agent & Protocol" },
  "GAP-07": { name: "Protocol Selection Lab", href: "/agents/protocol-selection", collection: "Agent & Protocol" },
  "GAP-08": { name: "Human in the loop Approval", href: "/agents/hitl", collection: "Agent & Protocol" },
  // Collection 3 · The Business of AI
  "C3-1": { name: "AI Initiative Portfolio Dashboard", href: "/business/portfolio", collection: "Business of AI" },
  "C3-2": { name: "Build vs Buy vs Fine tune", href: "/business/build-buy", collection: "Business of AI" },
  "C3-3": { name: "Inference Cost Forecaster", href: "/business/cost-forecaster", collection: "Business of AI" },
  "C3-4": { name: "Vendor Evaluation & Risk Monitor", href: "/business/vendor-monitor", collection: "Business of AI" },
  "C3-5": { name: "Business Case / ROI Builder", href: "/business/roi-builder", collection: "Business of AI" },
  // Collection 4 · Engagement Leadership
  "EL-01": { name: "Adoption & Change Readiness", href: "/engagement/adoption", collection: "Engagement Leadership" },
  "EL-02": { name: "Stakeholder & Sponsor Cockpit", href: "/engagement/stakeholders", collection: "Engagement Leadership" },
  "EL-03": { name: "Capacity & Resourcing Planner", href: "/engagement/capacity", collection: "Engagement Leadership" },
  "EL-04": { name: "Delivery Health & RAID Radar", href: "/engagement/raid-radar", collection: "Engagement Leadership" },
  "EL-05": { name: "AI Compliance Readiness Navigator", href: "/engagement/compliance", collection: "Engagement Leadership" },
  "EL-06": { name: "Talent & Upskilling Planner", href: "/engagement/talent", collection: "Engagement Leadership" },
  "EL-07": { name: "RFP/RFI Response War Room", href: "/engagement/rfp", collection: "Engagement Leadership" },
  "EL-08": { name: "Estimation & Scoping Studio", href: "/engagement/estimation", collection: "Engagement Leadership" },
  "EL-09": { name: "Onboarding & KT Tracker", href: "/engagement/onboarding", collection: "Engagement Leadership" },
  "EL-10": { name: "Executive Communication Studio", href: "/engagement/exec-comms", collection: "Engagement Leadership" },
};

// Build a deep-link into a lab, optionally pre-selecting a use case (?uc=).
export function labHref(labId: string, ucId?: string): string {
  const route = LAB_ROUTES[labId];
  if (!route) return "/";
  return ucId ? `${route.href}/?uc=${ucId}` : route.href;
}
