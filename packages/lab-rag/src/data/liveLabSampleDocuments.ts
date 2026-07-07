import type { SampleDocument } from "@rag/types/liveLab";

// Realistic but fictional policy documents for the Live RAG Evaluator Lab.
export const sampleDocuments: SampleDocument[] = [
  {
    id: "sample-travel",
    name: "Employee Travel Policy v3.2",
    fileType: "md",
    description: "Booking, approval thresholds, reimbursement limits, and receipts for business travel.",
    sampleQuestions: [
      "What are the reimbursement limits for international travel?",
      "When is manager approval required?",
      "What expenses are not reimbursable?",
      "What happens if a receipt is missing?",
    ],
    rawText: `# Employee Travel Policy v3.2

## 1. Purpose and Scope
This policy governs business travel booking, approvals, and expense reimbursement for all employees. It applies to domestic and international travel undertaken for company business.

## 2. Pre Trip Approval
Manager approval is required before booking any trip with an expected total cost above $2,500. Any single expense exceeding $500 also requires manager sign off regardless of the trip total. International travel always requires manager approval prior to booking, plus director approval when the destination is on the restricted travel list.

## 3. Booking and Travel Class
Employees must book through the approved corporate travel tool. Economy class is the default for all flights. Premium economy is permitted for flights longer than 6 hours, and business class requires VP approval and is only allowed for flights longer than 10 hours.

## 4. Meals and Per Diem
The domestic meal per diem is $55 per day. International meal reimbursement is capped at $75 per day unless a regional exception listed in Appendix C applies. Itemized receipts are required for any single meal exceeding $40.

## 5. Lodging
Lodging is reimbursed at actual reasonable cost up to the city limit published in Appendix B. Upgrades, resort fees, and in room entertainment are not reimbursable.

## 6. Receipts and Documentation
Receipts are required for all expenses of $25 or more. Expenses under $25 may be submitted with a written description in lieu of a receipt. If a required receipt is missing, the employee must submit a missing receipt declaration; reimbursement for missing receipts above $75 requires manager approval and may be denied.

## 7. Submission Deadline
Standard travel expense reports must be submitted within 30 days of trip completion. Reports submitted after 60 days may be denied except in documented exceptional circumstances.

## 8. Non Reimbursable Expenses
The following are not reimbursable: personal entertainment, traffic or parking fines, airline seat upgrades without approval, spouse or companion travel, minibar charges, and loss of personal items.

## 9. Exceptions
Exceptions to this policy require written approval from the employee's manager and the Finance Shared Services team. Exceptions are documented and reviewed quarterly.`,
  },
  {
    id: "sample-vendor",
    name: "Vendor Onboarding Policy v4.1",
    fileType: "md",
    description: "Due diligence, security review, and documentation required before activating a vendor.",
    sampleQuestions: [
      "What documents are required before onboarding a vendor?",
      "When is a security review required?",
      "Who approves high risk vendors?",
      "How long does vendor due diligence take?",
    ],
    rawText: `# Vendor Onboarding Policy v4.1

## 1. Purpose
This policy defines the steps required to evaluate, approve, and activate a new vendor. The goal is to manage financial, security, and compliance risk before any vendor receives access to company systems or data.

## 2. Required Documentation
Before a vendor can be activated, Procurement must collect: a signed Master Services Agreement (MSA), a completed security and privacy questionnaire, proof of insurance, and tax documentation (W-9 or local equivalent). Vendors handling personal data must also sign a Data Processing Agreement (DPA).

## 3. Risk Tiering
Each vendor is assigned a risk tier. Low risk vendors provide non sensitive goods or services with no system access. Medium risk vendors have limited system access. High risk vendors process personal data, access production systems, or support regulated business functions.

## 4. Security Review
A security review is required for all medium and high risk vendors. The review covers data handling, access controls, incident history, and subprocessor disclosure. High risk vendors additionally require a SOC 2 Type II report or equivalent independent assessment.

## 5. Approvals
Low risk vendors are approved by the Procurement lead. Medium risk vendors require Procurement and Information Security approval. High risk vendors require Procurement, Information Security, and Legal approval, and any high risk vendor with annual spend above $250,000 also requires CFO sign off.

## 6. Due Diligence Timeline
Standard due diligence takes 5 to 10 business days for low and medium risk vendors. High risk vendor due diligence may take 3 to 6 weeks depending on the depth of the security assessment and contract negotiation.

## 7. Activation
A vendor may only be activated after all required documents are collected, the risk tier is assigned, the security review is complete where required, and all approvals are recorded. Activation grants the minimum access necessary for the engagement.

## 8. Offboarding
When an engagement ends, access must be revoked, company data must be recovered or confirmed deleted, and a deletion certificate must be obtained for vendors that processed personal data.`,
  },
  {
    id: "sample-aigov",
    name: "AI Usage Governance Standard v1.3",
    fileType: "md",
    description: "Approved AI use cases, data handling rules, and review requirements for AI tools.",
    sampleQuestions: [
      "What AI use cases require governance review?",
      "Can customer data be used with external AI tools?",
      "What should the assistant do when sources conflict?",
      "Who approves new AI use cases?",
    ],
    rawText: `# AI Usage Governance Standard v1.3

## 1. Purpose
This standard governs the responsible use of artificial intelligence tools across the organization. It defines which use cases require review, how data may be handled, and who is accountable for AI risk.

## 2. Governance Review Required
Governance review is required for AI use cases that process personal or customer data, make or materially influence decisions about individuals, operate in regulated domains, or produce external facing generated content. Use cases that are not explicitly listed must still complete a lightweight risk screening; they are not automatically approved.

## 3. Data Handling
Customer or personal data may only be processed by external AI tools that appear on the approved tools list, are covered by a data processing agreement, and support an approved, governance reviewed use case. Confidential or regulated data must never be pasted into unapproved consumer AI tools.

## 4. Approved Tools
The AI Governance Office maintains the approved tools list. A data processing agreement alone is not sufficient to approve data use; the tool must also be on the approved list and tied to a reviewed use case.

## 5. Human Oversight
AI outputs used in decisions that affect individuals, finances, legal matters, or safety must have human oversight. The system must escalate to human review when confidence is low, evidence is missing, or the topic is high risk.

## 6. Conflicting Sources
When retrieved sources conflict, the system should defer to the current effective version, disclose the conflict to the user, cite the authoritative source, and route high risk topics to human review.

## 7. Approval Authority
New AI use cases are approved by the AI Governance Office. High risk use cases involving regulated data additionally require Legal and the relevant data owner. Approvals are time bound and re reviewed at least annually.

## 8. Monitoring and Audit
Approved AI use cases are monitored for drift, accuracy, and policy compliance. The AI Governance Office may suspend a use case that no longer meets the standard.`,
  },
];

export function getSampleById(id: string): SampleDocument | undefined {
  return sampleDocuments.find((d) => d.id === id);
}
