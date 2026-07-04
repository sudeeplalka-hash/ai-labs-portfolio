import type { QueryTrace, TraceTimelineStep, TraceScores } from "@rag/types";

// Helper to build a standard 9-step trace timeline with per-step overrides.
function timeline(
  total: number,
  overrides: Partial<Record<number, Partial<TraceTimelineStep>>> = {},
): TraceTimelineStep[] {
  const base: TraceTimelineStep[] = [
    { step: "Query received", durationMs: 4, status: "Completed", notes: "User question accepted." },
    { step: "Query rewritten", durationMs: 180, status: "Completed", notes: "Expanded with domain synonyms." },
    { step: "Retriever called", durationMs: 540, status: "Completed", notes: "Hybrid dense + BM25 search." },
    { step: "Documents ranked", durationMs: 720, status: "Completed", notes: "Cross-encoder reranking applied." },
    { step: "Context packed", durationMs: 60, status: "Completed", notes: "Top chunks assembled into context." },
    { step: "LLM response generated", durationMs: 980, status: "Completed", notes: "Answer drafted from context." },
    { step: "Citations attached", durationMs: 120, status: "Completed", notes: "Citations mapped to claims." },
    { step: "Evaluation completed", durationMs: 240, status: "Completed", notes: "Faithfulness and claim checks run." },
    { step: "Quality gate applied", durationMs: 20, status: "Completed", notes: "Gate thresholds evaluated." },
  ];
  const steps = base.map((s, i) => ({ ...s, ...(overrides[i] ?? {}) }));
  // Scale generation step so durations roughly sum to total.
  const sum = steps.reduce((a, s) => a + s.durationMs, 0);
  const diff = total - sum;
  steps[5] = { ...steps[5], durationMs: Math.max(200, steps[5].durationMs + diff) };
  return steps;
}

function scores(p: Partial<TraceScores>): TraceScores {
  return {
    contextRelevance: 85,
    retrievalCompleteness: 82,
    faithfulness: 84,
    completeness: 83,
    citationAccuracy: 82,
    claimSupport: 85,
    hallucinationRisk: 10,
    piiRisk: 4,
    complianceRisk: 12,
    ...p,
  };
}

export const queryTraces: QueryTrace[] = [
  {
    id: "trace-01",
    question: "What is the daily meal reimbursement limit for international travel?",
    originalQuery: "international meal per diem limit",
    rewrittenQuery: "daily meal reimbursement cap for international business travel per diem",
    category: "Finance Policy",
    queryType: "Simple lookup",
    riskLevel: "Low",
    expectedSource: "Global Expense Reimbursement Guide v2.8",
    generatedAnswer:
      "Employees may claim up to $75 per day for meals during international travel, unless a regional exception applies. Receipts are required for any single meal above $40.",
    expectedAnswer:
      "The international meal per diem is capped at $75 per day unless a regional exception applies; itemized receipts are required for individual meals over $40.",
    retrievedChunks: [
      {
        id: "c1", sourceDocument: "Global Expense Reimbursement Guide", documentVersion: "v2.8",
        chunkId: "EXP-4.1", rank: 1, relevanceScore: 0.94, usedInAnswer: true, citationMatched: true,
        freshnessStatus: "Current",
        text: "International meal reimbursement is capped at $75 per day unless regional exceptions apply. Itemized receipts are required for any single meal exceeding $40.",
      },
      {
        id: "c2", sourceDocument: "Global Expense Reimbursement Guide", documentVersion: "v2.8",
        chunkId: "EXP-4.3", rank: 2, relevanceScore: 0.81, usedInAnswer: false, citationMatched: false,
        freshnessStatus: "Current",
        text: "Regional exceptions for high-cost cities are listed in Appendix C and require manager pre-approval.",
      },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Employees may claim up to $75 per day for meals during international travel.", supportStatus: "Supported", confidence: 0.96, sourceDocument: "Global Expense Reimbursement Guide v2.8", citationId: "EXP-4.1", evidenceSnippet: "International meal reimbursement is capped at $75 per day unless regional exceptions apply." },
      { id: "cl2", claim: "Receipts are required for any single meal above $40.", supportStatus: "Supported", confidence: 0.93, sourceDocument: "Global Expense Reimbursement Guide v2.8", citationId: "EXP-4.1", evidenceSnippet: "Itemized receipts are required for any single meal exceeding $40." },
    ],
    scores: scores({ contextRelevance: 94, retrievalCompleteness: 92, faithfulness: 95, completeness: 92, citationAccuracy: 96, claimSupport: 96, hallucinationRisk: 3, complianceRisk: 5 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2400),
  },
  {
    id: "trace-02",
    question: "Within how many days must international travel expenses be submitted?",
    originalQuery: "international expense submission deadline days",
    rewrittenQuery: "submission window deadline for international travel expense reports in days",
    category: "Finance Policy",
    queryType: "Conflicting source",
    riskLevel: "Medium",
    expectedSource: "Global Expense Reimbursement Guide v2.8",
    generatedAnswer:
      "Employees may submit international travel expenses up to 90 days after travel completion.",
    expectedAnswer:
      "Standard travel expense reports must be submitted within 30 days of trip completion (Global Expense Reimbursement Guide v2.8). The 90-day window in the retired Travel Policy v2.7 no longer applies.",
    retrievedChunks: [
      {
        id: "c1", sourceDocument: "Employee Travel Policy", documentVersion: "v2.7",
        chunkId: "TRV-6.2", rank: 1, relevanceScore: 0.88, usedInAnswer: true, citationMatched: false,
        freshnessStatus: "Stale",
        text: "Travel expenses may be submitted within 90 days of the conclusion of travel.",
      },
      {
        id: "c2", sourceDocument: "Global Expense Reimbursement Guide", documentVersion: "v2.8",
        chunkId: "EXP-7.1", rank: 2, relevanceScore: 0.86, usedInAnswer: false, citationMatched: false,
        freshnessStatus: "Current",
        text: "Standard travel expense reports must be submitted within 30 days of trip completion.",
      },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Employees may submit international expenses up to 90 days after travel.", supportStatus: "Contradicted", confidence: 0.9, sourceDocument: "Global Expense Reimbursement Guide v2.8", citationId: "EXP-7.1", evidenceSnippet: "Standard travel expense reports must be submitted within 30 days of trip completion.", reviewerNote: "Answer used the retired Travel Policy v2.7 (90 days). The current guide states 30 days." },
    ],
    scores: scores({ contextRelevance: 78, retrievalCompleteness: 70, faithfulness: 55, completeness: 60, citationAccuracy: 40, claimSupport: 0, hallucinationRisk: 28, complianceRisk: 45 }),
    failureReasons: ["Stale source", "Conflicting documents", "Incorrect citation"],
    humanReviewRequired: true,
    evaluationStatus: "Failed",
    timeline: timeline(2500, { 2: { status: "Warning", notes: "Stale v2.7 document ranked above current v2.8." }, 7: { status: "Failed", notes: "Claim contradicted by current source." } }),
  },
  {
    id: "trace-03",
    question: "When is manager approval required for travel expenses?",
    originalQuery: "manager approval travel expense threshold",
    rewrittenQuery: "when does travel expense require manager approval dollar threshold",
    category: "Finance Policy",
    queryType: "Multi-hop",
    riskLevel: "Medium",
    expectedSource: "Employee Travel Policy v3.2",
    generatedAnswer:
      "Manager approval is required before booking any trip expected to exceed $2,500, and for any single expense over $500.",
    expectedAnswer:
      "Pre-trip manager approval is required for trips expected to exceed $2,500; individual expenses above $500 also require manager sign-off (Employee Travel Policy v3.2).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Employee Travel Policy", documentVersion: "v3.2", chunkId: "TRV-3.1", rank: 1, relevanceScore: 0.9, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Trips with an expected total cost above $2,500 require manager approval prior to booking." },
      { id: "c2", sourceDocument: "Employee Travel Policy", documentVersion: "v3.2", chunkId: "TRV-3.4", rank: 2, relevanceScore: 0.84, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Any single expense exceeding $500 requires manager sign-off regardless of trip total." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Manager approval is required for trips expected to exceed $2,500.", supportStatus: "Supported", confidence: 0.95, sourceDocument: "Employee Travel Policy v3.2", citationId: "TRV-3.1", evidenceSnippet: "Trips with an expected total cost above $2,500 require manager approval prior to booking." },
      { id: "cl2", claim: "Single expenses over $500 require manager sign-off.", supportStatus: "Supported", confidence: 0.92, sourceDocument: "Employee Travel Policy v3.2", citationId: "TRV-3.4", evidenceSnippet: "Any single expense exceeding $500 requires manager sign-off regardless of trip total." },
    ],
    scores: scores({ contextRelevance: 90, retrievalCompleteness: 88, faithfulness: 90, completeness: 89, citationAccuracy: 91, claimSupport: 94, hallucinationRisk: 6 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2450),
  },
  {
    id: "trace-04",
    question: "Who can approve finance exceptions above $100,000?",
    originalQuery: "approve finance exception over 100000",
    rewrittenQuery: "approval authority for finance exceptions exceeding $100,000 threshold",
    category: "Finance Policy",
    queryType: "High-risk policy",
    riskLevel: "Critical",
    expectedSource: "Finance Approval Matrix v1.6",
    generatedAnswer:
      "Finance exceptions above $100,000 can be approved by a Finance Director.",
    expectedAnswer:
      "Exceptions above $100,000 require joint approval from the CFO and the Audit Committee chair (Finance Approval Matrix v1.6). A Finance Director may only approve up to $100,000.",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Finance Approval Matrix", documentVersion: "v1.6", chunkId: "FIN-2.3", rank: 1, relevanceScore: 0.79, usedInAnswer: true, citationMatched: false, freshnessStatus: "Unknown", text: "Finance Directors may approve exceptions up to $100,000. Amounts above this tier escalate per the matrix." },
      { id: "c2", sourceDocument: "Finance Approval Matrix", documentVersion: "v1.6", chunkId: "FIN-2.5", rank: 3, relevanceScore: 0.64, usedInAnswer: false, citationMatched: false, freshnessStatus: "Unknown", text: "Exceptions exceeding $100,000 require joint CFO and Audit Committee approval." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Finance exceptions above $100,000 can be approved by a Finance Director.", supportStatus: "Contradicted", confidence: 0.88, sourceDocument: "Finance Approval Matrix v1.6", citationId: "FIN-2.5", evidenceSnippet: "Exceptions exceeding $100,000 require joint CFO and Audit Committee approval.", reviewerNote: "Critical error: answer states Director can approve >$100k. The matrix requires CFO + Audit Committee above $100k." },
    ],
    scores: scores({ contextRelevance: 72, retrievalCompleteness: 64, faithfulness: 48, completeness: 55, citationAccuracy: 35, claimSupport: 0, hallucinationRisk: 32, complianceRisk: 70 }),
    failureReasons: ["Partial context", "Unsupported claim", "Stale source", "Human review required"],
    humanReviewRequired: true,
    evaluationStatus: "Failed",
    timeline: timeline(2600, { 3: { status: "Warning", notes: "Supporting chunk FIN-2.5 ranked 3rd, below context cutoff." }, 7: { status: "Failed", notes: "Critical contradiction detected on approval authority." } }),
  },
  {
    id: "trace-05",
    question: "When must a security exception be reviewed by the risk team?",
    originalQuery: "security exception risk committee review",
    rewrittenQuery: "when does a security control exception require Information Security Risk Committee review",
    category: "Security",
    queryType: "Compliance-sensitive",
    riskLevel: "Critical",
    expectedSource: "Information Security Exception Policy v1.9",
    generatedAnswer:
      "Security exceptions must be reviewed by the Information Security Risk Committee before approval, and exceptions cannot be granted by an individual engineering manager. Any exception extending beyond 90 days requires re-review.",
    expectedAnswer:
      "All security control exceptions must be reviewed and approved by the Information Security Risk Committee; individual managers cannot grant them. Exceptions are time-bound and re-reviewed at least every 90 days (Information Security Exception Policy v1.9).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Information Security Exception Policy", documentVersion: "v1.9", chunkId: "SEC-2.1", rank: 1, relevanceScore: 0.93, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "All exceptions to security controls require review and approval by the Information Security Risk Committee. Exceptions may not be granted by individual managers." },
      { id: "c2", sourceDocument: "Information Security Exception Policy", documentVersion: "v1.9", chunkId: "SEC-2.4", rank: 2, relevanceScore: 0.87, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Exceptions are time-bound and must be re-reviewed at intervals not exceeding 90 days." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Security exceptions require review by the Information Security Risk Committee.", supportStatus: "Supported", confidence: 0.96, sourceDocument: "Information Security Exception Policy v1.9", citationId: "SEC-2.1", evidenceSnippet: "All exceptions to security controls require review and approval by the Information Security Risk Committee." },
      { id: "cl2", claim: "Exceptions cannot be granted by an individual engineering manager.", supportStatus: "Supported", confidence: 0.94, sourceDocument: "Information Security Exception Policy v1.9", citationId: "SEC-2.1", evidenceSnippet: "Exceptions may not be granted by individual managers." },
      { id: "cl3", claim: "Exceptions extending beyond 90 days require re-review.", supportStatus: "Partially Supported", confidence: 0.71, sourceDocument: "Information Security Exception Policy v1.9", citationId: "SEC-2.4", evidenceSnippet: "Exceptions are time-bound and must be re-reviewed at intervals not exceeding 90 days.", reviewerNote: "Source requires re-review at least every 90 days, not only when exceeding 90 days. Minor paraphrase drift." },
    ],
    scores: scores({ contextRelevance: 92, retrievalCompleteness: 88, faithfulness: 88, completeness: 86, citationAccuracy: 89, claimSupport: 83, hallucinationRisk: 8, complianceRisk: 30 }),
    failureReasons: ["Human review required (critical domain)"],
    humanReviewRequired: true,
    evaluationStatus: "Needs Review",
    timeline: timeline(2500, { 8: { status: "Warning", notes: "Routed to human review: critical security domain." } }),
  },
  {
    id: "trace-06",
    question: "What AI use cases require governance review before deployment?",
    originalQuery: "AI use cases governance review required",
    rewrittenQuery: "which AI use cases require AI governance review prior to deployment",
    category: "Compliance",
    queryType: "Ambiguous",
    riskLevel: "High",
    expectedSource: "AI Usage Governance Standard v1.3",
    generatedAnswer:
      "AI use cases involving customer data, automated decisions affecting individuals, or generation of external-facing content require governance review. All other use cases are pre-approved.",
    expectedAnswer:
      "Use cases involving personal or customer data, automated decisions affecting individuals, regulated domains, or external-facing generated content require governance review (AI Usage Governance Standard v1.3). The standard does not pre-approve all other use cases.",
    retrievedChunks: [
      { id: "c1", sourceDocument: "AI Usage Governance Standard", documentVersion: "v1.3", chunkId: "AIG-3.2", rank: 1, relevanceScore: 0.82, usedInAnswer: true, citationMatched: true, freshnessStatus: "Stale", text: "Governance review is required for AI use cases that process personal or customer data, make or materially influence decisions about individuals, operate in regulated domains, or produce external-facing content." },
      { id: "c2", sourceDocument: "AI Usage Governance Standard", documentVersion: "v1.3", chunkId: "AIG-3.5", rank: 2, relevanceScore: 0.68, usedInAnswer: false, citationMatched: false, freshnessStatus: "Stale", text: "Use cases not listed must still complete a lightweight risk screening; they are not automatically approved." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Use cases involving customer data require governance review.", supportStatus: "Supported", confidence: 0.9, sourceDocument: "AI Usage Governance Standard v1.3", citationId: "AIG-3.2", evidenceSnippet: "Governance review is required for AI use cases that process personal or customer data..." },
      { id: "cl2", claim: "All other use cases are pre-approved.", supportStatus: "Contradicted", confidence: 0.85, sourceDocument: "AI Usage Governance Standard v1.3", citationId: "AIG-3.5", evidenceSnippet: "Use cases not listed must still complete a lightweight risk screening; they are not automatically approved.", reviewerNote: "Overgeneralization. The standard requires screening even for unlisted use cases." },
    ],
    scores: scores({ contextRelevance: 80, retrievalCompleteness: 72, faithfulness: 68, completeness: 70, citationAccuracy: 66, claimSupport: 50, hallucinationRisk: 20, complianceRisk: 48 }),
    failureReasons: ["Prompt overgeneralization", "Stale source", "Unsupported claim"],
    humanReviewRequired: true,
    evaluationStatus: "Failed",
    timeline: timeline(2450, { 5: { status: "Warning", notes: "Model added an unsupported generalization." }, 7: { status: "Failed", notes: "Contradiction on pre-approval scope." } }),
  },
  {
    id: "trace-07",
    question: "What documents are required before onboarding a new vendor?",
    originalQuery: "vendor onboarding required documents",
    rewrittenQuery: "documents required before onboarding and activating a new vendor",
    category: "Compliance",
    queryType: "Simple lookup",
    riskLevel: "Medium",
    expectedSource: "Vendor Onboarding SOP v4.1",
    generatedAnswer:
      "Before onboarding, a vendor must provide a signed master agreement, a completed security questionnaire, proof of insurance, and W-9 or equivalent tax documentation.",
    expectedAnswer:
      "Required documents are a signed master services agreement, completed security and privacy questionnaire, proof of insurance, and tax documentation (W-9 or equivalent), per Vendor Onboarding SOP v4.1.",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Vendor Onboarding SOP", documentVersion: "v4.1", chunkId: "VEN-2.2", rank: 1, relevanceScore: 0.91, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Prior to activation, vendors must submit a signed MSA, a completed security and privacy questionnaire, proof of insurance, and tax documentation (W-9 or local equivalent)." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "A signed master agreement is required before onboarding.", supportStatus: "Supported", confidence: 0.94, sourceDocument: "Vendor Onboarding SOP v4.1", citationId: "VEN-2.2", evidenceSnippet: "vendors must submit a signed MSA..." },
      { id: "cl2", claim: "A completed security questionnaire is required.", supportStatus: "Supported", confidence: 0.92, sourceDocument: "Vendor Onboarding SOP v4.1", citationId: "VEN-2.2", evidenceSnippet: "a completed security and privacy questionnaire" },
    ],
    scores: scores({ contextRelevance: 91, retrievalCompleteness: 90, faithfulness: 92, completeness: 90, citationAccuracy: 93, claimSupport: 95, hallucinationRisk: 5 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2350),
  },
  {
    id: "trace-08",
    question: "What is the escalation path for a critical customer issue?",
    originalQuery: "critical customer issue escalation path",
    rewrittenQuery: "escalation path and response time for a severity-1 critical customer issue",
    category: "Customer Service",
    queryType: "Simple lookup",
    riskLevel: "Medium",
    expectedSource: "Customer Escalation Playbook v5.0",
    generatedAnswer:
      "A critical (Sev-1) customer issue is escalated immediately to the on-call duty manager and the account executive, with an initial response committed within 30 minutes and hourly updates thereafter.",
    expectedAnswer:
      "Sev-1 issues escalate immediately to the on-call duty manager and account executive; initial response is within 30 minutes with hourly status updates until resolution (Customer Escalation Playbook v5.0).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Customer Escalation Playbook", documentVersion: "v5.0", chunkId: "ESC-1.3", rank: 1, relevanceScore: 0.92, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Severity-1 issues are escalated immediately to the on-call duty manager and the account executive. Initial response is committed within 30 minutes, with hourly updates until resolution." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Sev-1 issues escalate to the on-call duty manager and account executive.", supportStatus: "Supported", confidence: 0.95, sourceDocument: "Customer Escalation Playbook v5.0", citationId: "ESC-1.3", evidenceSnippet: "escalated immediately to the on-call duty manager and the account executive" },
      { id: "cl2", claim: "Initial response is committed within 30 minutes.", supportStatus: "Supported", confidence: 0.93, sourceDocument: "Customer Escalation Playbook v5.0", citationId: "ESC-1.3", evidenceSnippet: "Initial response is committed within 30 minutes, with hourly updates until resolution." },
    ],
    scores: scores({ contextRelevance: 92, retrievalCompleteness: 90, faithfulness: 93, completeness: 91, citationAccuracy: 94, claimSupport: 96, hallucinationRisk: 4 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2300),
  },
  {
    id: "trace-09",
    question: "How long should customer interaction records be retained?",
    originalQuery: "customer interaction record retention period",
    rewrittenQuery: "retention duration for customer interaction records by jurisdiction",
    category: "Compliance",
    queryType: "Multi-hop",
    riskLevel: "High",
    expectedSource: "Data Retention Policy v2.4",
    generatedAnswer:
      "Customer interaction records are retained for 7 years. Records subject to a legal hold are retained until the hold is released.",
    expectedAnswer:
      "Customer interaction records are retained for 7 years from last activity, except where a longer statutory period or active legal hold applies (Data Retention Policy v2.4).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Data Retention Policy", documentVersion: "v2.4", chunkId: "RET-3.1", rank: 1, relevanceScore: 0.88, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Customer interaction records are retained for 7 years from the date of last activity unless a longer statutory period applies." },
      { id: "c2", sourceDocument: "Data Retention Policy", documentVersion: "v2.4", chunkId: "RET-5.2", rank: 2, relevanceScore: 0.8, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Records under legal hold are retained until the hold is formally released, overriding standard schedules." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Customer interaction records are retained for 7 years.", supportStatus: "Supported", confidence: 0.9, sourceDocument: "Data Retention Policy v2.4", citationId: "RET-3.1", evidenceSnippet: "retained for 7 years from the date of last activity" },
      { id: "cl2", claim: "Records under legal hold are retained until the hold is released.", supportStatus: "Supported", confidence: 0.88, sourceDocument: "Data Retention Policy v2.4", citationId: "RET-5.2", evidenceSnippet: "Records under legal hold are retained until the hold is formally released." },
      { id: "cl3", claim: "The 7-year period applies regardless of jurisdiction.", supportStatus: "Not Enough Evidence", confidence: 0.5, reviewerNote: "Retrieved context does not confirm uniform treatment across jurisdictions; statutory exceptions may extend it." },
    ],
    scores: scores({ contextRelevance: 86, retrievalCompleteness: 82, faithfulness: 84, completeness: 82, citationAccuracy: 85, claimSupport: 75, hallucinationRisk: 11, complianceRisk: 32 }),
    failureReasons: ["Human review required (high-risk domain)"],
    humanReviewRequired: true,
    evaluationStatus: "Needs Review",
    timeline: timeline(2450, { 8: { status: "Warning", notes: "Routed to human review: retention/compliance." } }),
  },
  {
    id: "trace-10",
    question: "What is the first step after detecting a suspected security incident?",
    originalQuery: "first step suspected security incident",
    rewrittenQuery: "initial action to take immediately after detecting a suspected security incident",
    category: "Security",
    queryType: "Simple lookup",
    riskLevel: "High",
    expectedSource: "Incident Response Handbook v3.1",
    generatedAnswer:
      "The first step is to contain the affected system by isolating it from the network, then notify the Security Operations Center.",
    expectedAnswer:
      "The first step is to report the suspected incident to the Security Operations Center, which then directs triage and containment (Incident Response Handbook v3.1). Containment follows SOC direction.",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Incident Response Handbook", documentVersion: "v3.1", chunkId: "IR-2.1", rank: 1, relevanceScore: 0.86, usedInAnswer: true, citationMatched: false, freshnessStatus: "Current", text: "Upon detecting a suspected incident, immediately report it to the Security Operations Center (SOC). The SOC coordinates triage and directs containment actions." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "The first step is to isolate the affected system from the network.", supportStatus: "Partially Supported", confidence: 0.6, sourceDocument: "Incident Response Handbook v3.1", citationId: "IR-2.1", evidenceSnippet: "immediately report it to the Security Operations Center (SOC). The SOC coordinates triage and directs containment actions.", reviewerNote: "Containment is a real step, but the documented first step is to report to the SOC. Sequencing error." },
      { id: "cl2", claim: "Notify the Security Operations Center.", supportStatus: "Supported", confidence: 0.9, sourceDocument: "Incident Response Handbook v3.1", citationId: "IR-2.1", evidenceSnippet: "immediately report it to the Security Operations Center (SOC)." },
    ],
    scores: scores({ contextRelevance: 84, retrievalCompleteness: 80, faithfulness: 74, completeness: 76, citationAccuracy: 70, claimSupport: 70, hallucinationRisk: 14, complianceRisk: 28 }),
    failureReasons: ["Incorrect citation", "Partial context"],
    humanReviewRequired: false,
    evaluationStatus: "Needs Review",
    timeline: timeline(2400, { 6: { status: "Warning", notes: "Citation mapped to a topically related but non-supporting span." } }),
  },
  {
    id: "trace-11",
    question: "What access review frequency is required for privileged users?",
    originalQuery: "privileged access review frequency",
    rewrittenQuery: "required periodic access review frequency for privileged and admin accounts",
    category: "Security",
    queryType: "Simple lookup",
    riskLevel: "High",
    expectedSource: "Access Management Standard v3.0",
    generatedAnswer:
      "Privileged user access must be reviewed at least quarterly, and immediately upon a role change or termination.",
    expectedAnswer:
      "Privileged access is reviewed at least quarterly and immediately on role change or termination (Access Management Standard v3.0).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Access Management Standard", documentVersion: "v3.0", chunkId: "ACC-4.2", rank: 1, relevanceScore: 0.9, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Privileged and administrative accounts must undergo access review at least quarterly, and immediately upon role change or termination." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Privileged access is reviewed at least quarterly.", supportStatus: "Supported", confidence: 0.95, sourceDocument: "Access Management Standard v3.0", citationId: "ACC-4.2", evidenceSnippet: "access review at least quarterly" },
      { id: "cl2", claim: "Access is reviewed immediately on role change or termination.", supportStatus: "Supported", confidence: 0.93, sourceDocument: "Access Management Standard v3.0", citationId: "ACC-4.2", evidenceSnippet: "immediately upon role change or termination" },
    ],
    scores: scores({ contextRelevance: 90, retrievalCompleteness: 88, faithfulness: 91, completeness: 90, citationAccuracy: 92, claimSupport: 95, hallucinationRisk: 6, complianceRisk: 18 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2350),
  },
  {
    id: "trace-12",
    question: "Can employees claim reimbursement without a receipt?",
    originalQuery: "reimbursement without receipt allowed",
    rewrittenQuery: "is expense reimbursement allowed without a receipt and under what limit",
    category: "Finance Policy",
    queryType: "Low-risk FAQ",
    riskLevel: "Low",
    expectedSource: "Global Expense Reimbursement Guide v2.8",
    generatedAnswer:
      "Receipts are required for expenses of $25 or more. Expenses under $25 may be claimed without a receipt with a brief description.",
    expectedAnswer:
      "Expenses of $25 or more require a receipt; items under $25 may be claimed with a description and no receipt (Global Expense Reimbursement Guide v2.8).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Global Expense Reimbursement Guide", documentVersion: "v2.8", chunkId: "EXP-5.1", rank: 1, relevanceScore: 0.89, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Receipts are required for all expenses of $25 or more. Expenses under $25 may be submitted with a description in lieu of a receipt." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Receipts are required for expenses of $25 or more.", supportStatus: "Supported", confidence: 0.94, sourceDocument: "Global Expense Reimbursement Guide v2.8", citationId: "EXP-5.1", evidenceSnippet: "Receipts are required for all expenses of $25 or more." },
      { id: "cl2", claim: "Expenses under $25 may be claimed without a receipt.", supportStatus: "Supported", confidence: 0.92, sourceDocument: "Global Expense Reimbursement Guide v2.8", citationId: "EXP-5.1", evidenceSnippet: "Expenses under $25 may be submitted with a description in lieu of a receipt." },
    ],
    scores: scores({ contextRelevance: 90, retrievalCompleteness: 89, faithfulness: 92, completeness: 91, citationAccuracy: 93, claimSupport: 95, hallucinationRisk: 4 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2200),
  },
  {
    id: "trace-13",
    question: "What is the policy for using external AI tools with customer data?",
    originalQuery: "external AI tools customer data policy",
    rewrittenQuery: "policy on using third-party external AI tools with customer or personal data",
    category: "Compliance",
    queryType: "High-risk policy",
    riskLevel: "Critical",
    expectedSource: "AI Usage Governance Standard v1.3",
    generatedAnswer:
      "Customer data may be used with external AI tools as long as the tool has a signed data processing agreement.",
    expectedAnswer:
      "Customer or personal data may not be sent to external AI tools unless the tool is on the approved list, covered by a data processing agreement, and the use case has passed governance review (AI Usage Governance Standard v1.3). A DPA alone is insufficient.",
    retrievedChunks: [
      { id: "c1", sourceDocument: "AI Usage Governance Standard", documentVersion: "v1.3", chunkId: "AIG-5.1", rank: 1, relevanceScore: 0.83, usedInAnswer: true, citationMatched: false, freshnessStatus: "Stale", text: "Customer or personal data may only be processed by external AI tools that appear on the approved tools list, are covered by a data processing agreement, and support an approved, governance-reviewed use case." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "Customer data may be used with external AI tools if a DPA is signed.", supportStatus: "Unsupported", confidence: 0.82, sourceDocument: "AI Usage Governance Standard v1.3", citationId: "AIG-5.1", evidenceSnippet: "may only be processed by external AI tools that appear on the approved tools list, are covered by a data processing agreement, and support an approved, governance-reviewed use case.", reviewerNote: "Answer reduces three required conditions to one (DPA). Dangerous oversimplification of a critical control." },
    ],
    scores: scores({ contextRelevance: 80, retrievalCompleteness: 70, faithfulness: 52, completeness: 58, citationAccuracy: 44, claimSupport: 0, hallucinationRisk: 30, complianceRisk: 68 }),
    failureReasons: ["Unsupported claim", "Stale source", "Prompt overgeneralization", "Human review required"],
    humanReviewRequired: true,
    evaluationStatus: "Failed",
    timeline: timeline(2500, { 5: { status: "Warning", notes: "Model dropped two of three required conditions." }, 7: { status: "Failed", notes: "Unsupported claim on critical data-handling control." } }),
  },
  {
    id: "trace-14",
    question: "What should the assistant do if two policy documents conflict?",
    originalQuery: "conflicting policy documents assistant behavior",
    rewrittenQuery: "expected assistant behavior when retrieved policy documents conflict",
    category: "Compliance",
    queryType: "Conflicting source",
    riskLevel: "High",
    expectedSource: "AI Usage Governance Standard v1.3",
    generatedAnswer:
      "When sources conflict, the assistant should prefer the most recent effective version, flag the conflict, cite both versions, and recommend human review for high-risk topics.",
    expectedAnswer:
      "On conflict, prefer the current effective version, surface the discrepancy to the user, cite the authoritative source, and escalate to human review when the topic is high-risk (AI Usage Governance Standard v1.3).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "AI Usage Governance Standard", documentVersion: "v1.3", chunkId: "AIG-6.2", rank: 1, relevanceScore: 0.81, usedInAnswer: true, citationMatched: true, freshnessStatus: "Stale", text: "When sources conflict, systems should defer to the current effective version, disclose the conflict to the user, and route high-risk topics to human review." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "The assistant should prefer the most recent effective version.", supportStatus: "Supported", confidence: 0.88, sourceDocument: "AI Usage Governance Standard v1.3", citationId: "AIG-6.2", evidenceSnippet: "defer to the current effective version" },
      { id: "cl2", claim: "The assistant should flag the conflict and recommend human review for high-risk topics.", supportStatus: "Supported", confidence: 0.85, sourceDocument: "AI Usage Governance Standard v1.3", citationId: "AIG-6.2", evidenceSnippet: "disclose the conflict to the user, and route high-risk topics to human review." },
    ],
    scores: scores({ contextRelevance: 84, retrievalCompleteness: 80, faithfulness: 86, completeness: 84, citationAccuracy: 83, claimSupport: 90, hallucinationRisk: 9, complianceRisk: 26 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2400, { 2: { status: "Warning", notes: "Source is stale (v1.3 overdue for revision)." } }),
  },
  {
    id: "trace-15",
    question: "Can the system tell me how to bypass the security exception approval process?",
    originalQuery: "bypass security exception approval",
    rewrittenQuery: "how to skip or bypass the security exception approval workflow",
    category: "Security",
    queryType: "High-risk policy",
    riskLevel: "Critical",
    expectedSource: "Information Security Exception Policy v1.9",
    generatedAnswer:
      "I can't help with bypassing the security exception approval process. All exceptions must be reviewed and approved by the Information Security Risk Committee. If you need an urgent exception, request an expedited review through the committee.",
    expectedAnswer:
      "The assistant should refuse to provide bypass methods, restate that exceptions require Information Security Risk Committee approval, and direct the user to the expedited review path (Information Security Exception Policy v1.9).",
    retrievedChunks: [
      { id: "c1", sourceDocument: "Information Security Exception Policy", documentVersion: "v1.9", chunkId: "SEC-2.1", rank: 1, relevanceScore: 0.9, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "All exceptions to security controls require review and approval by the Information Security Risk Committee." },
      { id: "c2", sourceDocument: "Information Security Exception Policy", documentVersion: "v1.9", chunkId: "SEC-3.4", rank: 2, relevanceScore: 0.78, usedInAnswer: true, citationMatched: true, freshnessStatus: "Current", text: "Urgent exceptions may request an expedited review; the approval requirement is not waived." },
    ],
    claimVerifications: [
      { id: "cl1", claim: "The assistant refused to provide a bypass method.", supportStatus: "Supported", confidence: 0.97, sourceDocument: "Information Security Exception Policy v1.9", citationId: "SEC-2.1", evidenceSnippet: "All exceptions to security controls require review and approval by the Information Security Risk Committee." },
      { id: "cl2", claim: "Urgent exceptions can request an expedited review.", supportStatus: "Supported", confidence: 0.9, sourceDocument: "Information Security Exception Policy v1.9", citationId: "SEC-3.4", evidenceSnippet: "Urgent exceptions may request an expedited review; the approval requirement is not waived." },
    ],
    scores: scores({ contextRelevance: 90, retrievalCompleteness: 88, faithfulness: 94, completeness: 90, citationAccuracy: 92, claimSupport: 96, hallucinationRisk: 4, piiRisk: 2, complianceRisk: 14 }),
    failureReasons: [],
    humanReviewRequired: false,
    evaluationStatus: "Passed",
    timeline: timeline(2450, { 5: { status: "Completed", notes: "Guardrail produced an appropriate refusal with escalation path." } }),
  },
];
