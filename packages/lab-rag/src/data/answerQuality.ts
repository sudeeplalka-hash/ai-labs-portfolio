import type { AnswerMetric, AnswerFailureExample } from "@rag/types";

export const answerMetrics: AnswerMetric[] = [
  { id: "faithfulness", label: "Faithfulness", value: 84, target: 85, status: "Watch", interpretation: "Answers are mostly grounded; a few over-generalize beyond the retrieved source." },
  { id: "completeness", label: "Completeness", value: 83, target: 85, status: "Watch", interpretation: "Most answers cover required parts; multi-condition policies are sometimes truncated." },
  { id: "relevance", label: "Answer Relevance", value: 90, target: 88, status: "Healthy", interpretation: "Answers directly address the question with little drift." },
  { id: "conciseness", label: "Conciseness", value: 87, target: 85, status: "Healthy", interpretation: "Responses avoid unnecessary padding while keeping required detail." },
  { id: "citation", label: "Citation Accuracy", value: 82, target: 85, status: "At Risk", interpretation: "Below threshold; topically related but non-supporting citations remain the top failure." },
  { id: "refusal", label: "Refusal Appropriateness", value: 91, target: 90, status: "Healthy", interpretation: "The guardrail correctly refuses and escalates on bypass and high-risk requests." },
  { id: "hallucination", label: "Hallucination Risk", value: 11, target: 8, status: "Watch", interpretation: "Lower-is-better. Concentrated in critical policy-exception queries." },
  { id: "tone", label: "Tone Consistency", value: 93, target: 90, status: "Healthy", interpretation: "Answers maintain a consistent, enterprise-appropriate tone." },
];

export const answerFailureExamples: AnswerFailureExample[] = [
  { id: "ae-1", title: "Looked correct, cited the wrong source", failureMode: "Incorrect citation", riskLevel: "High", question: "What is the first step after detecting a suspected security incident?", generatedAnswer: "The first step is to contain the affected system by isolating it from the network, then notify the SOC.", whatWentWrong: "Containment is a valid step, but the documented first step is to report to the SOC. The citation pointed to a related span that did not support the sequencing claim.", expectedBehavior: "State 'report to the SOC first' and cite IR-2.1, which defines the reporting-first sequence." },
  { id: "ae-2", title: "Partially correct but incomplete", failureMode: "Partial context", riskLevel: "Critical", question: "Who can approve finance exceptions above $100,000?", generatedAnswer: "Finance exceptions above $100,000 can be approved by a Finance Director.", whatWentWrong: "The supporting chunk (FIN-2.5) requiring CFO + Audit Committee approval ranked below the context cutoff, so the answer stated only the lower tier.", expectedBehavior: "Retrieve the >$100k tier and answer that joint CFO and Audit Committee approval is required." },
  { id: "ae-3", title: "Hallucinated a policy exception", failureMode: "Unsupported claim", riskLevel: "Critical", question: "What is the policy for using external AI tools with customer data?", generatedAnswer: "Customer data may be used with external AI tools as long as the tool has a signed DPA.", whatWentWrong: "The policy requires three conditions (approved list, DPA, governance-reviewed use case). The answer collapsed them into one, creating a dangerous false permission.", expectedBehavior: "Require all three conditions, or refuse and route to governance review when uncertain." },
  { id: "ae-4", title: "Refused when it should have answered", failureMode: "Refusal failure", riskLevel: "Low", question: "What is the per-diem for domestic overnight travel?", generatedAnswer: "I'm not able to provide policy guidance on travel reimbursements.", whatWentWrong: "An overly broad guardrail blocked a low-risk, clearly grounded lookup that should have been answered directly.", expectedBehavior: "Answer $55 per day (or city exception) and cite the travel policy; reserve refusals for genuinely high-risk gaps." },
  { id: "ae-5", title: "Answered when it should have escalated", failureMode: "Guardrail gap", riskLevel: "Critical", question: "Within how many days must international travel expenses be submitted?", generatedAnswer: "Employees may submit international expenses up to 90 days after travel.", whatWentWrong: "A stale document (Travel v2.7) outranked the current guide. The system answered confidently instead of flagging the version conflict.", expectedBehavior: "Detect the conflict between v2.7 and v2.8, prefer the current 30-day rule, and surface the discrepancy." },
];

// Baseline vs improved answer comparison for a representative query.
export const answerComparison = {
  question: "Within how many days must international travel expenses be submitted?",
  baseline: {
    label: "baseline-vector-rag-v1",
    answer: "Travel expenses can be submitted within 90 days of travel.",
    faithfulness: 55,
    citationAccuracy: 40,
    note: "Used the stale v2.7 source with no conflict detection.",
  },
  improved: {
    label: "compliance-guardrail-v6",
    answer: "Standard travel expense reports must be submitted within 30 days of trip completion (Global Expense Reimbursement Guide v2.8). A retired policy version lists 90 days and no longer applies; the conflict has been flagged for review.",
    faithfulness: 86,
    citationAccuracy: 88,
    note: "Metadata filtering down-weighted the stale version and the guardrail surfaced the conflict.",
  },
};
