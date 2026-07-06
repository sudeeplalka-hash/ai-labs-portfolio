// Static content for the Strategy & Planning lab: the sample initiative that
// pre-fills the workshop, the use case archetypes, and the narrative copy.
import type { Workshop } from "./model";

export const SAMPLE: Workshop = {
  initiativeName: "Customer Support Knowledge Assistant",
  businessFunction: "Customer Operations",
  sponsor: "VP, Customer Support",
  process: "Level 1 support knowledge lookup",
  painPoint: "Agents search across too many policy and troubleshooting documents, which increases handle time and creates inconsistent answers.",
  targetUsers: "Level 1 support agents and team leads",
  facing: "Internal",
  ambition: "Help agents find the right policy and troubleshooting answer instantly, with a citation they can trust.",
  aiPattern: "Search / knowledge assistant",
  expectedAction: "Use the cited answer to resolve the customer's issue on first contact.",
  humanReview: "Yes",
  baseline: "8.5 min average handle time",
  target: "6.8 min within 90 days",
  usersImpacted: "1,200",
  frequency: "Every ticket (high volume)",
  valueDriver: "Cycle time reduction",
  timeHorizon: "90 days",
  dataSources: "Support knowledge base, policy documents, troubleshooting guides, historical case notes",
  dataOwner: "Knowledge Management team",
  dataSensitivity: "Internal",
  dataGaps: "Some troubleshooting guides are outdated; case note quality varies.",
  freshnessConcern: "Yes",
  dataStructure: "Mixed",
  impactIfWrong: "Medium",
  regulatory: "Moderate",
  auditTrail: "Yes",
  citationRequired: "Yes",
  escalationPath: "Yes",
  integrations: "Contact center platform, knowledge base",
  workflowChange: "Medium",
  techDependency: "Medium",
  adoptionComplexity: "Medium",
  pilotUrgency: "High",
};

export interface Archetype {
  name: string; bestFit: string; dataNeeded: string; risks: string; controls: string; metric: string;
}
export const ARCHETYPES: Archetype[] = [
  { name: "Knowledge Assistant", bestFit: "Internal search, policy lookup, support docs, employee enablement", dataNeeded: "Curated documents, policies, and FAQs, with clear ownership and freshness", risks: "Stale sources, weak citations, hallucinated policy answers", controls: "Citation enforcement, source freshness, confidence threshold", metric: "Handle time ↓, first contact resolution ↑, answer consistency" },
  { name: "Workflow Summarization", bestFit: "Call notes, case & claim summaries, meeting recaps, research synthesis", dataNeeded: "Transcripts, notes, and source records, often with PII to redact", risks: "Omitted details, incorrect emphasis, privacy leakage", controls: "Human review, redaction, summary quality checks", metric: "Time saved per summary, reviewer edit rate" },
  { name: "Decision Support", bestFit: "Recommendations, prioritization, risk review, financial analysis", dataNeeded: "Structured records plus supporting evidence for each recommendation", risks: "Unsupported recommendations, bias, unclear rationale", controls: "Explainability, evidence links, human approval", metric: "Decision quality, cycle time, approval rate" },
  { name: "Agentic Workflow", bestFit: "Multistep task execution, tool use, approvals, escalations", dataNeeded: "APIs and tools with scoped permissions and a system of record", risks: "Runaway actions, tool misuse, excessive cost", controls: "Permission boundaries, step logging, action approval", metric: "Tasks completed autonomously, cost per task, error rate" },
  { name: "Customer Experience Automation", bestFit: "Contact center, IVR, chatbot, routing, omnichannel support", dataNeeded: "Conversation logs, intents, knowledge base, routing rules", risks: "Customer frustration, incorrect answers, compliance exposure", controls: "Escalation path, QA sampling, conversation monitoring", metric: "Containment rate, CSAT, escalation quality" },
  { name: "Finance / Operations Analytics", bestFit: "Variance analysis, reporting automation, forecasting support, exception detection", dataNeeded: "Trusted datasets and definitions with clear lineage tracking", risks: "Bad assumptions, stale data, overconfidence", controls: "Data lineage, variance thresholds, human sign off", metric: "Exceptions caught, reporting time ↓, forecast error" },
];

export const VALUE_CARDS = [
  { title: "Frame the business problem", body: "Turn a vague ambition into a sponsored, scoped use case with a real pain point and a target user." },
  { title: "Score value and readiness", body: "A live readiness score, from 0 to 100, across value, data, feasibility, risk and adoption, with the gates you must clear." },
  { title: "Generate the initiative brief", body: "A structured, board ready brief you can save, copy, and hand off straight into the Data Lab." },
];

export const TRANSFORMATION = {
  vague: "Use AI to improve customer support.",
  sharpened: "Deploy an internal knowledge assistant for Level 1 support agents to reduce average handle time, improve answer consistency, and increase first contact resolution across policy and troubleshooting workflows.",
  falsifiable: "Within 90 days, reduce average handle time from 8.5 minutes to 6.8 minutes for the top 25 support intents while maintaining answer accuracy above 90% and escalation quality above 95%.",
};

export const PROOF_CARDS = [
  { title: "Business led AI intake", body: "Starts from the business problem, sponsor, and workflow, not the model. The use case earns its way in." },
  { title: "Value and readiness scoring", body: "A defensible score that says what's strong, what's weak, and what's missing, before a dollar is spent on build." },
  { title: "Governed handoff to delivery", body: "A structured brief with gates and controls flows into the Data Lab, so delivery starts from a decision, not a guess." },
];

export const WHAT_THIS_DEMONSTRATES = "This lab demonstrates how an enterprise AI initiative should be shaped before build begins. It connects business value, user workflow, data readiness, risk exposure, adoption complexity, and delivery feasibility into a structured decision. The goal is not to approve every AI idea. The goal is to identify which ideas deserve investment, which need redesign, and which should not proceed yet.";
