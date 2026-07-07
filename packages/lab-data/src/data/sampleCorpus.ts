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

## Getting started
New vendors must complete the intake form before any contract is signed.
The procurement team reviews submissions within 5 business days.

## Security review
All vendors handling customer data complete a security questionnaire.
Escalate exceptions to security@example.com.

## Payment terms
Standard terms are Net 30. Early payment discounts are negotiated case by case.`;

const CLEAN = `# Quarterly Engineering Update

Our retrieval quality improved meaningfully this quarter. We shipped hybrid
search and a reranker, which together raised answer faithfulness.

The main remaining risk is latency under peak load. We are evaluating a
smaller reranker model to bring P95 back under the service level target.

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

// A curated set for the Corpus Builder batch demo: includes a duplicate pair
// (crm export ↔ customers master) and a stale-version conflict pair (policy v2.7/v3.1).
export const CORPUS_SAMPLES: SampleFile[] = [
  { id: "c-crm2", name: "crm_export_v2.csv", label: "CRM export v2", blurb: "Current CRM extract", content: CRM },
  { id: "c-crmdup", name: "customers_master.csv", label: "Customers master", blurb: "Exact duplicate of the CRM data", content: CRM_DUP },
  { id: "c-pol27", name: "travel_policy_v2.7_legacy.txt", label: "Travel policy v2.7", blurb: "Superseded version", content: STALE_POLICY },
  { id: "c-pol31", name: "travel_policy_v3.1_current.txt", label: "Travel policy v3.1", blurb: "Current version", content: CURRENT_POLICY },
  { id: "c-kb", name: "vendor_onboarding_kb.md", label: "Vendor onboarding KB", blurb: "Knowledge base", content: KB },
  { id: "c-eng", name: "eng_update_q2.md", label: "Eng update Q2", blurb: "Clean reference", content: CLEAN },
];
