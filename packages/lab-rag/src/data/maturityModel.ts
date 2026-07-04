import type { MaturityLevel, ChecklistItem } from "@rag/types";

export const CURRENT_LEVEL = 3;

export const maturityLevels: MaturityLevel[] = [
  {
    level: 1,
    name: "Basic Demo",
    description: "A simple RAG prototype that retrieves documents and generates answers, with no systematic evaluation, traceability, or governance.",
    capabilities: ["Simple vector search", "Basic prompt", "Manual testing", "No golden dataset", "No automated evaluation", "No quality gates"],
  },
  {
    level: 2,
    name: "Measured Prototype",
    description: "Early measurement practices exist, but the system still relies on manual review and ad hoc testing.",
    capabilities: ["Small test set", "Basic retrieval metrics", "Manual answer review", "Prompt iteration", "Initial failure notes"],
  },
  {
    level: 3,
    name: "Controlled Pilot",
    description: "Structured evaluation, traceability, failure taxonomy, risk categorization, and human review for sensitive cases are in place.",
    capabilities: [
      "Golden dataset (50 cases)",
      "Automated evaluation across runs",
      "Query trace inspection",
      "Retrieved chunk analysis",
      "Claim-level verification",
      "Failure taxonomy + recommended fixes",
      "Risk classification",
      "Human review for critical cases",
      "Initial quality gates",
    ],
    evidence: [
      "Six evaluation runs tracked and compared with regression detection.",
      "Golden dataset includes high-risk and critical compliance questions.",
      "Traces expose retrieved chunks, generated vs expected answers, and scores.",
      "Claim-level verification flags supported, unsupported, and contradicted claims.",
      "Failure categories map to root causes and recommended fixes.",
      "Quality gates are defined and applied to the release decision.",
      "Critical-risk queries are routed to human review.",
    ],
    gaps: [
      "Continuous monitoring is not yet connected to live production traffic.",
      "Regression gates are defined but not integrated with CI/CD.",
      "The human review workflow is simulated, not operational.",
      "Evaluation data is static mock data in v1.",
      "SLA reporting is not connected to real system logs.",
      "Governance reporting is not yet audit-ready.",
    ],
  },
  {
    level: 4,
    name: "Production Managed",
    description: "The system is monitored continuously, tested before release, governed through quality gates, and managed with production SLAs.",
    capabilities: ["Continuous monitoring", "CI/CD regression testing", "Prompt/model/retriever versioning", "SLA tracking", "Operational human review queue", "Governance reporting", "Cost and latency controls"],
  },
  {
    level: 5,
    name: "Enterprise Scale",
    description: "The system is audit-ready, policy-driven, continuously monitored, and connected to business outcomes across multiple domains.",
    capabilities: ["Automated quality gates in CI/CD", "Audit-ready evidence packages", "Business KPI linkage", "Policy-driven controls", "Cross-domain governance", "Automated drift detection", "Continuous improvement flywheel"],
  },
];

export const productionReadinessChecklist: ChecklistItem[] = [
  { id: "pr-1", item: "Golden dataset covering high-risk and critical domains", status: "Complete", notes: "50 cases across 8 domains with risk and difficulty labels." },
  { id: "pr-2", item: "Automated evaluation with regression detection", status: "Complete", notes: "Six runs compared; regression rules applied automatically." },
  { id: "pr-3", item: "Claim-level verification of answers", status: "Complete", notes: "Claims scored as supported, unsupported, or contradicted." },
  { id: "pr-4", item: "Quality gates wired into the release decision", status: "Complete", notes: "Eight gates evaluated; release recommendation derived from gate status." },
  { id: "pr-5", item: "Citation accuracy at or above 85%", status: "In Progress", notes: "Currently 82%. Claim-to-evidence overlap check in development." },
  { id: "pr-6", item: "Zero critical hallucination failures", status: "In Progress", notes: "One critical compliance failure remains open." },
  { id: "pr-7", item: "P95 latency within the 4s SLA", status: "In Progress", notes: "Currently 4.25s after reranker rollout; optimization planned." },
  { id: "pr-8", item: "Continuous monitoring on live traffic", status: "Not Started", notes: "Requires trace collector and metrics store integration." },
  { id: "pr-9", item: "CI/CD-integrated regression gates", status: "Not Started", notes: "Gates defined but not yet enforced in the pipeline." },
  { id: "pr-10", item: "Operational human review workflow", status: "Not Started", notes: "Review is simulated in v1; queue and SLAs not yet operational." },
  { id: "pr-11", item: "Audit-ready governance evidence package", status: "Not Started", notes: "Evidence is viewable in-app but not exportable for audit." },
];

export const nextInvestments = [
  "Connect the dashboard to live RAG trace logs.",
  "Add automated CI/CD regression checks.",
  "Operationalize the human review workflow.",
  "Add document freshness monitoring and stale-version exclusion.",
  "Add policy-driven routing for high-risk queries.",
  "Expand golden dataset coverage across critical domains.",
  "Add business KPI linkage for successful query resolution.",
  "Create audit-ready evaluation evidence packages.",
];
