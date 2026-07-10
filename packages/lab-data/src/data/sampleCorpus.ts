// Deliberately messy sample files so any visitor can drive the Live Data Lab.

export interface SampleFile {
  id: string;
  name: string;
  label: string;
  blurb: string;
  content: string;
}

const CRM = `customer_id,name,email,signup_date,plan,monthly_spend,region,notes
1001,Ada Lovelace,ada@example.com,2024-01-15,Pro,89.00,EMEA,
1002,Alan Turing,alan@example.com,2024/02/03,Pro,89,EMEA,renewed
1002,Alan Turing,alan@example.com,2024/02/03,Pro,89,EMEA,renewed
1003,Grace Hopper,,2024-03-21,Enterprise,,AMER,call back re SSN 123-45-6789
1004,,katherine@example.com,,Free,0,AMER,
1005,Katherine Johnson,kj@example.com,2024-04-02,Pro,89.00,AMER,card 4111 1111 1111 1111 on file
1006,Edsger Dijkstra,ed@example.com,2024-05-19,Enterprise,540.00,EMEA,
,,,,,,,
1007,Margaret Hamilton,mh@example.com,2024-06-30,Pro,89.00,AMER,phone 415-555-0192`;

const STALE_POLICY = `Travel & Expense Policy, Version 2.7 (SUPERSEDED)
Effective: 2022-01-01

1. Reimbursement limits
The daily meal allowance is $60 for domestic travel.
Air travel must be booked in economy class for flights under 6 hours.

2. Approval
Expenses over $500 require manager approval.
Expenses over $500 require manager approval.
Expenses over $500 require manager approval.

NOTE: This version was replaced by v3.1. Do not distribute.
Contact travel admin@example.com for the current policy.`;

const KB = `# Vendor Onboarding Knowledge Base

---

## Getting started
New vendors must complete the intake form before any contract is signed.
The procurement team reviews submissions within 5 business days.

---

## Security review
All vendors handling customer data complete a security questionnaire.
Escalate exceptions to the security desk.

---

## Payment terms
Standard terms are Net 30. Early payment discounts are negotiated case by case.`;

const CLEAN = `# Quarterly Engineering Update

---

Our retrieval quality improved meaningfully this quarter. We shipped hybrid
search and a reranker, which together raised answer faithfulness.

---

The main remaining risk is latency under peak load. We are evaluating a
smaller reranker model to bring P95 back under the service level target.

---

Next quarter we will focus on citation accuracy and on reducing the number
of stale documents that reach the index.`;

// A clinical note packed with protected health information (PHI). Great for
// trying the Healthcare · HIPAA profile, which turns any of these into a blocker.
const CLINICAL = `Clinical Intake Note, Riverside Family Practice

Patient: J. Doe    DOB: 1984-07-12
MRN: 0048213
Visit date: 2026-05-14

Chief complaint: follow up for type 2 diabetes.
Assessment: ICD-10 E11.9 (type 2 diabetes mellitus without complications).
Plan: continue metformin 500mg; recheck A1c in 3 months.

Ordering provider: Dr. A. Smith, NPI 1234567890
Controlled substance authority: DEA AB1234563
Billing contact: billing@riverside health.example`;

// A payments remittance with bank + card identifiers. Pairs well with the
// Payments · PCI DSS and Finance profiles.
const PAYMENTS = `Vendor Remittance Advice, Q2 Payments Run

Beneficiary: Acme Supplies Ltd
IBAN: DE89 3704 0044 0532 0130 00
SWIFT/BIC: COBADEFFXXX
US backup account, routing number 021000021, account 000123456789

Invoice INV-4471 .... $12,400.00  paid 2026-04-02
Invoice INV-4490 .... $ 3,150.00  paid 2026-04-18
Card on file for expedited fees: 4111 1111 1111 1111

Questions: ap@acme supplies.example`;

// A leaked .env config, secrets that should never reach an index.
const SECRETS = `# deploy.env  (DO NOT COMMIT)
# Pasted into the wiki by mistake, a sample of what NOT to ingest.

AWS_ACCESS_KEY_ID=<redacted fake sample not a real key>
STRIPE_SECRET_KEY=<redacted fake sample not a real key>
GITHUB_TOKEN=<redacted fake sample not a real key>
SLACK_BOT_TOKEN=<redacted fake sample not a real key>

DB_HOST=prod db.internal
DB_USER=app
# Reminder: rotate all of these before the next release.`;

export const SAMPLE_CORPUS: SampleFile[] = [
  { id: "crm", name: "crm_export_v2.csv", label: "Messy CRM export", blurb: "Duplicates, missing values & PII (SSN + card).", content: CRM },
  { id: "clinical", name: "intake_note_riverside.txt", label: "Clinical intake note", blurb: "Health records, MRN, NPI, DEA & ICD-10 (try HIPAA).", content: CLINICAL },
  { id: "payments", name: "remittance_q2.txt", label: "Payments remittance", blurb: "Bank + card data, IBAN, routing, account (try PCI).", content: PAYMENTS },
  { id: "secrets", name: "deploy.env", label: "Leaked config dump", blurb: "Live API keys & tokens that must never be ingested.", content: SECRETS },
  { id: "stale", name: "travel_policy_v2.7_legacy.txt", label: "Stale policy version", blurb: "Superseded version with repeated boilerplate.", content: STALE_POLICY },
  { id: "kb", name: "vendor_onboarding_kb.md", label: "Mixed knowledge base", blurb: "Mostly clean; needs metadata & sign off.", content: KB },
  { id: "clean", name: "eng_update_q2.md", label: "Clean reference doc", blurb: "Well formed, should clear the gate.", content: CLEAN },
];

// The current version of the travel policy, a near-duplicate of the stale v2.7
// with a DIFFERENT meal allowance. Together they form a version-conflict pair.
const CURRENT_POLICY = `Travel & Expense Policy, Version 3.1 (CURRENT)
Effective: 2024-01-01

1. Reimbursement limits
The daily meal allowance is $75 for domestic travel.
Air travel must be booked in economy class for flights under 6 hours.

2. Approval
Expenses over $500 require manager approval.

This is the current, authoritative travel policy.
Contact travel admin@example.com for questions.`;

// A second copy of the CRM data under a different name, an exact DUPLICATE that
// should never be embedded twice.
const CRM_DUP = CRM;

// The ORIGINAL 2019 policy: with v2.7 and v3.1 it forms a three-file version
// chain, so duplicate resolution shows a set with more than two members.
const ARCHIVE_POLICY = `Travel & Expense Policy, Version 1.0 (ARCHIVED)
Effective: 2019-06-01

---

1. Reimbursement limits
The daily meal allowance is $45 for domestic travel.
Air travel must be booked in economy class for all flights.

---

2. Approval
Expenses over $300 require manager approval.

---

This document is retained for audit purposes only.
Contact travel admin@example.com with archive questions.`;

// A NEAR-duplicate of the vendor KB: same facts rephrased as an FAQ, with one
// answer that has drifted out of date (Net 45 vs the KB's Net 30). No version
// marker in the name, so the pair reads as redundancy, not a version conflict.
const KB_FAQ = `# Vendor Onboarding FAQ

---

Q: What must a new vendor complete before a contract is signed?
A: The vendor intake form must be completed before any contract is signed.

---

Q: How fast does the procurement team review a submission?
A: The procurement team reviews vendor submissions within 5 business days.

---

Q: Do vendors handling customer data need a security review?
A: Yes, vendors handling customer data complete a security questionnaire.
Escalate the exceptions to security@example.com before the contract review.

---

Q: What are the standard payment terms?
A: Standard vendor payment terms are Net 45.
This answer was migrated from the vendor onboarding knowledge base wiki.

Q: Who do I ask when something is missing here?
A: Email procurement@example.com and the team will follow up.
This answer was migrated from the vendor onboarding knowledge base wiki.

Q: Where is the full policy?
A: The vendor onboarding knowledge base holds the complete process.
This answer was migrated from the vendor onboarding knowledge base wiki.`;

// A support export that survived a bad encoding conversion: two replacement
// characters (fixable by re-encoding), plus contact PII, a duplicated row,
// and missing cells.
const TICKETS = `ticket_id,customer_email,phone,subject,status,opened,notes
7001,ada@example.com,415-555-0182,Login loop after password reset,open,2026-05-02,customer reports repeated redirects
7002,alan@example.com,,Exported report shows � characters,open,2026-05-03,encoding issue in the csv export
7003,grace@example.com,206-555-0114,Billing page timeout,closed,2026-05-04,
7003,grace@example.com,206-555-0114,Billing page timeout,closed,2026-05-04,
7004,,,Search returns stale results,open,2026-05-06,customer cites an outdated policy answer
7005,kj@example.com,415-555-0139,Attachment upload fails over 10 MB,open,2026-05-08,� mangled filename in the log`;

// A clean engineering postmortem: the ANSWER document for the outage question.
const POSTMORTEM = `# Incident Postmortem: Search Outage, April 12

## Summary
Search was unavailable for 41 minutes. The root cause was connection pool
exhaustion in the retrieval service after the reranker deploy doubled query
fan-out.

---

## Timeline
09:14 first alerts fired, 09:20 incident declared, 09:55 full recovery.

---

## Root cause
Connection pool exhaustion: the new reranker issued two retrieval calls per
query and the pool ceiling was never raised.

---

## Follow-ups
Raise the pool ceiling and add saturation alerts before the next deploy.
The support team will link this writeup when a customer ticket cites a stale
answer, and the policy for the incident review stays in the knowledge base.`;

// Product release notes: a second engineering-adjacent prose doc.
const RELEASE_NOTES = `# Release Notes, 2026 Q2

---

Shipped this quarter: hybrid search is generally available, the reranker is
default-on, and answer citations link back to source passages.

---

The admin console adds usage dashboards and per-team quotas.

---

Rollout is gradual over two weeks behind a feature flag per workspace.`;

// A VALID JSON price catalog (the dropzone advertises JSON; the sample should
// exercise it): parses as tabular, with a duplicated SKU row and missing cells.
const CATALOG = `[
  { "sku": "PLN-100", "plan": "Starter", "monthly_price": 29, "seats": 5, "support_tier": "community", "notes": "For the small teams that are getting started with the basics." },
  { "sku": "PLN-200", "plan": "Team", "monthly_price": 99, "seats": 25, "support_tier": "standard", "notes": "Adds the shared workspaces and the usage reports for growing teams." },
  { "sku": "PLN-300", "plan": "Enterprise", "monthly_price": 499, "seats": 250, "support_tier": "priority", "notes": "Priority support is included for the enterprise plan, with the audit log and the SSO." },
  { "sku": "PLN-300", "plan": "Enterprise", "monthly_price": 499, "seats": 250, "support_tier": "priority", "notes": "Priority support is included for the enterprise plan, with the audit log and the SSO." },
  { "sku": "PLN-400", "plan": "Scale", "monthly_price": null, "seats": null, "support_tier": "priority", "notes": "Custom pricing from the sales team for the largest deployments." }
]`;

// Product overview prose: anchors the product topic cluster with the catalog.
const OVERVIEW = `# Product Overview: Relay Answers

---

Relay Answers is an answers workspace for operations teams: every plan
indexes the knowledge base, the policies, and the vendor onboarding process,
and answers arrive with links back to the source documents.

---

Native connectors cover the help desk, the chat tools, and the document
stores; the sync runs every fifteen minutes on all plans.

---

Pricing follows the plan seats in the catalog: the Starter and Team plans
share the standard support tier, and the Enterprise plan adds the priority
support tier, the audit log, and data residency options.`;

// Bilingual support macros: Spanish-primary with English mirror lines, so the
// language heuristic reads Spanish at LOW confidence (a watch, not a blocker)
// and the corpus language mix stops being trivially all-English.
const MACROS_ES = `# Macros de soporte (ES) / Support macros

---

Saludo: Gracias por contactar al equipo de soporte. Estamos revisando el ticket con los detalles de la cuenta.
Greeting: Thanks for contacting the support team. We are reviewing the ticket and the account details.

---

Contrasena: Para restablecer la contrasena, el cliente debe usar el enlace que se envia por correo a la cuenta.
Password reset: the customer must use the reset link that is sent in the email.

---

Escalacion: Los casos urgentes se escalan al equipo de guardia con una nota para el contexto de la solicitud.
Escalation: urgent cases go to the on-call team with a note for context.

---

Cierre: La solicitud queda resuelta; responda para reabrir el caso con una referencia de la conversacion.
Closing: reply to this message to reopen the case with the same reference.`;

// A curated set for the Corpus Builder batch demo. Coverage by design:
//  - exact duplicate pair: crm_export_v2.csv = customers_master.csv
//  - three-file stale-version chain: travel policy v1.0 / v2.7 / v3.1
//  - near-duplicate pair (no version markers): vendor KB = vendor FAQ
//  - mangled encoding + contact PII: support_tickets_export.csv
//  - JSON coverage with tabular defects: product_catalog.json
//  - language mix: soporte_macros_es.md (Spanish primary, low confidence)
//  - four confirmable topic clusters over the 11 prose files:
//    travel policies, vendor onboarding, engineering, product.
export const CORPUS_SAMPLES: SampleFile[] = [
  { id: "c-crm2", name: "crm_export_v2.csv", label: "CRM export v2", blurb: "Current CRM extract", content: CRM },
  { id: "c-crmdup", name: "customers_master.csv", label: "Customers master", blurb: "Exact duplicate of the CRM data", content: CRM_DUP },
  { id: "c-pol10", name: "travel_policy_v1.0_archive.txt", label: "Travel policy v1.0", blurb: "Original archived version", content: ARCHIVE_POLICY },
  { id: "c-pol27", name: "travel_policy_v2.7_legacy.txt", label: "Travel policy v2.7", blurb: "Superseded version", content: STALE_POLICY },
  { id: "c-pol31", name: "travel_policy_v3.1_current.txt", label: "Travel policy v3.1", blurb: "Current version", content: CURRENT_POLICY },
  { id: "c-kb", name: "vendor_onboarding_kb.md", label: "Vendor onboarding KB", blurb: "Knowledge base", content: KB },
  { id: "c-faq", name: "vendor_onboarding_faq.md", label: "Vendor FAQ", blurb: "Near-duplicate of the KB, one stale answer", content: KB_FAQ },
  { id: "c-eng", name: "eng_update_q2.md", label: "Eng update Q2", blurb: "Clean reference", content: CLEAN },
  { id: "c-pm", name: "incident_postmortem_2026-04.md", label: "Incident postmortem", blurb: "April outage writeup", content: POSTMORTEM },
  { id: "c-rel", name: "release_notes_2026q2.md", label: "Release notes Q2", blurb: "What shipped this quarter", content: RELEASE_NOTES },
  { id: "c-cat", name: "product_catalog.json", label: "Product catalog", blurb: "Valid JSON with a duplicated SKU", content: CATALOG },
  { id: "c-ovr", name: "product_overview.md", label: "Product overview", blurb: "What the platform does", content: OVERVIEW },
  { id: "c-tix", name: "support_tickets_export.csv", label: "Support tickets", blurb: "Mangled encoding + contact PII", content: TICKETS },
  { id: "c-es", name: "soporte_macros_es.md", label: "Support macros (ES)", blurb: "Bilingual, Spanish-primary", content: MACROS_ES },
];
