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

// ---------------------------------------------------------------------------
// STAGE_SECTIONS · the ONE nav config for Collection 1's stage sub-pages (R2.2).
// Both the sidebar's collapsible trees AND the Header band's StageNav render from
// this list, so the two can never disagree again (Build's grouped sections used
// to exist only in the sidebar while its in-page subnav showed a flat row).
// Hash hrefs (Deploy/Realize) address in-page sections; the views listen for
// hashchange. Grouped stages follow Govern's grouped pattern; a single
// unlabeled group renders as a flat chip row.
// ---------------------------------------------------------------------------

export interface StageSectionItem { label: string; href: string }
export interface StageSectionGroup {
  /** Short name. The sidebar rail is 288px wide, so this stays terse. */
  label?: string;
  /**
   * Question-first act heading for the in-page pipeline nav. A stage that defines
   * `act` on its groups opts INTO the editorial pipeline layout; every other stage
   * keeps rendering the flat/grouped chip rows. STAGES already asks a question per
   * stage ("Does the system work?") — this is the same voice one level down.
   *
   * Deliberately NOT reusing `label`: the sidebar wants "Evaluation", the in-page
   * nav wants "Is it good enough?". One config, two surfaces, each taking the field
   * that fits its width.
   */
  act?: string;
  /** One quiet line under the act heading. */
  blurb?: string;
  /** Reference material. Renders in the footer row, not as an act column. */
  utility?: boolean;
  items: StageSectionItem[];
}
/** Mirrors program-core's StageKey (kit stays dependency-free by design). */
export type StageSectionsKey = "frame" | "data" | "build" | "deploy" | "govern" | "realize" | "operate";

export const STAGE_SECTIONS: Partial<Record<StageSectionsKey, StageSectionGroup[]>> = {
  frame: [{ items: [
    { label: "Strategy workshop", href: "/frame" },
    { label: "Guide", href: "/frame/guide" },
  ] }],
  data: [{ items: [
    { label: "Live Data Lab", href: "/data" },
    { label: "Overview", href: "/data/overview" },
    { label: "Corpus", href: "/data/corpus" },
    { label: "Pipeline", href: "/data/pipeline" },
    { label: "Guide", href: "/data/guide" },
  ] }],
  // Build's three acts. NOTE: the stage question is already "Does the system work?"
  // (STAGES.build), so act 1 must NOT be "Does it work?" — it would echo the heading
  // directly above it. "Can it answer?" narrows to what those four pages actually do.
  build: [
    { label: "Pipeline", act: "Can it answer?", blurb: "Retrieval and generation, end to end.", items: [
      { label: "Live Evaluator", href: "/build" },
      { label: "Model fit", href: "/build/model" },
      { label: "Retrieval", href: "/build/retrieval" },
      { label: "Answers", href: "/build/answers" },
    ] },
    { label: "Evaluation", act: "Is it good enough?", blurb: "Measured, not asserted.", items: [
      { label: "Evaluations", href: "/build/evaluations" },
      { label: "Golden Dataset", href: "/build/dataset" },
      { label: "Traces", href: "/build/traces" },
      { label: "Quality Gates", href: "/build/quality-gates" },
      { label: "Failures", href: "/build/failures" },
    ] },
    { label: "Capabilities", act: "How far can it go?", blurb: "Agents, tuning, and the wiring underneath.", items: [
      { label: "Agents & Tools", href: "/build/agents" },
      { label: "Training Readiness", href: "/build/training" },
      { label: "Under the Hood", href: "/build/internals" },
    ] },
    { label: "Reference", utility: true, items: [
      { label: "Overview", href: "/build/overview" },
      { label: "Guide", href: "/build/guide" },
    ] },
  ],
  deploy: [{ items: [
    { label: "Operating envelope", href: "/deploy#envelope" },
    { label: "Compare configs", href: "/deploy#compare" },
    { label: "Under load", href: "/deploy#under-load" },
    { label: "Incident response", href: "/deploy#incident" },
    { label: "Guide", href: "/deploy/guide" },
  ] }],
  // Govern is Build's structural twin: three substantive acts plus reference. The
  // Cockpit is the stage's own landing page, so it sits in the utility row rather
  // than inside an act — it is where you arrive, not a step you take.
  govern: [
    { label: "Overview", utility: true, items: [
      { label: "Cockpit", href: "/govern" },
      { label: "Guide", href: "/govern/guide" },
    ] },
    { label: "Control plane", act: "What's allowed?", blurb: "Risk, policy, and the use-case gate.", items: [
      { label: "Use cases", href: "/govern/use-cases" },
      { label: "Risk", href: "/govern/risk" },
      { label: "Policies", href: "/govern/policies" },
      { label: "Playground", href: "/govern/playground" },
      { label: "Evals", href: "/govern/evals" },
    ] },
    { label: "Experiences", act: "Does it hold?", blurb: "Watch the guardrails take a hit.", items: [
      { label: "See it live", href: "/govern/live" },
      { label: "Red team arcade", href: "/govern/arcade" },
      { label: "What if calc", href: "/govern/value" },
      { label: "Maturity", href: "/govern/maturity" },
    ] },
    { label: "Assurance", act: "Can you prove it?", blurb: "The evidence a regulator asks for.", items: [
      { label: "Audit log", href: "/govern/audit-logs" },
      { label: "Review queue", href: "/govern/review-queue" },
      { label: "Evidence", href: "/govern/evidence" },
      { label: "Readiness", href: "/govern/readiness" },
      { label: "Board brief", href: "/govern/brief" },
    ] },
    { label: "Reference", utility: true, items: [
      { label: "Docs", href: "/govern/docs" },
      { label: "Settings", href: "/govern/settings" },
    ] },
  ],
  realize: [{ items: [
    { label: "The verdict", href: "/realize#verdict" },
    { label: "Where the value goes", href: "/realize#value" },
    { label: "What moves it most", href: "/realize#levers" },
    { label: "Adoption plan", href: "/realize#adoption" },
    { label: "Traceability dossier", href: "/realize#dossier" },
    { label: "Guide", href: "/realize/guide" },
  ] }],
  operate: [{ items: [
    { label: "Day two console", href: "/operate" },
    { label: "Guide", href: "/operate/guide" },
  ] }],
};
