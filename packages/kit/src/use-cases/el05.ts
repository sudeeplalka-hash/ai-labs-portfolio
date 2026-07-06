// EL-05 · AI Compliance Readiness Navigator, use cases.
// Payload = a pre-classified initiative: its function label + base tier, the
// autonomy/data/impact profile, and a domain-specific control overlay that
// appends to the EU AI Act obligations (finserv / employment / clinical).
// The autonomy/data/impact toggles stay interactive so the tier logic is live.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export type El05Tier = "prohibited" | "high" | "limited" | "minimal";
export interface El05Control { label: string; met: boolean }
export interface El05Payload {
  fnLabel: string;
  base: El05Tier;
  autonomy: string; // "advisory" | "hitl" | "auto"
  data: string;     // "none" | "personal" | "sensitive"
  impact: string;   // "low" | "significant" | "rights"
  overlayLabel: string;
  overlay: El05Control[];      // appended for high/limited tiers
  rationaleOverlay: string;    // appended to the classification rationale
}

export const EL05_USE_CASES: UseCase<El05Payload>[] = assertUseCases<El05Payload>([
  {
    id: "el05-lending-credit-decisioning",
    labId: "EL-05",
    industry: "financial-services",
    provenance: firstHand,
    title: "Credit / loan eligibility decisioning",
    oneLiner: "High risk plus rights-affecting, fair-lending and model-risk stack on top of the Act.",
    context:
      "An AI system scoring loan and credit-eligibility decisions. It's a rights-affecting decision on people's access to an essential service, on sensitive financial data, the highest-scrutiny corner of the Act, with a fair-lending and model-risk overlay layered on.",
    theDecision:
      "Design the overlay in, not on: this is high risk under the Act and rights-affecting, so fair-lending testing, adverse-action reason codes, and SR 11-7 model risk aren't add-ons, they're the build spec.",
    whatMostMiss:
      "Teams treat the EU AI Act obligations as the whole checklist and forget the sectoral overlay (ECOA/fair-lending, model-risk governance) that regulators actually examine first in finance.",
    stakes: "Miss the fair-lending overlay and the model clears the Act but fails the exam that shuts lending down.",
    takeaway: "In lending, the sectoral overlay (fair-lending, model risk) is examined before the Act, design it in.",
    sources: [
      "Regulated lending / credit-decisioning delivery (firsthand, financial services)",
      "EU AI Act high risk structure + ECOA / SR 11-7 overlay (illustrative, not legal advice)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      fnLabel: "Credit / loan eligibility decisioning",
      base: "high",
      autonomy: "hitl",
      data: "sensitive",
      impact: "rights",
      overlayLabel: "Fair-lending / model-risk overlay",
      overlay: [
        { label: "Model risk management (SR 11-7 style)", met: false },
        { label: "Fair-lending / disparate-impact testing", met: true },
        { label: "Adverse-action reason codes (ECOA)", met: false },
      ],
      rationaleOverlay: "Sensitive financial data and a rights-affecting credit decision, fair-lending and model-risk obligations apply on top of the Act.",
    },
  },
  {
    id: "el05-hiring-resume-screening",
    labId: "EL-05",
    industry: "hr",
    provenance: studied,
    title: "Resume screening / candidate ranking",
    oneLiner: "Employment is high risk by category, bias-audit law applies even with a human in the loop.",
    context:
      "An AI system screening resumes and ranking candidates. Employment decisioning is a high risk use by category under the Act, and a growing body of employment law (adverse-impact testing, bias-audit mandates) applies whether or not a recruiter makes the final call.",
    theDecision:
      "A human reviewer doesn't downgrade the tier: employment is high risk by category, so adverse-impact testing, an independent bias audit, and a candidate appeal path are required even with a recruiter in the loop.",
    whatMostMiss:
      "Teams assume keeping a human in the loop drops hiring AI to limited-risk. It doesn't, the category is high risk, and bias-audit statutes attach to the tool, not the final decider.",
    stakes: "Skip the bias audit and the tool is unlawful to use in a growing list of jurisdictions regardless of accuracy.",
    takeaway: "In hiring AI, a human in the loop doesn't lower the tier, the category is high risk, bias audit and all.",
    sources: [
      "HR / hiring AI compliance (studied)",
      "EU AI Act Annex III (employment) + bias-audit statutes, e.g. NYC LL144 (illustrative, not legal advice)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      fnLabel: "Resume screening / candidate ranking",
      base: "high",
      autonomy: "hitl",
      data: "personal",
      impact: "rights",
      overlayLabel: "Employment / anti-discrimination overlay",
      overlay: [
        { label: "Adverse-impact (four-fifths) testing", met: false },
        { label: "Independent bias audit (e.g., NYC LL144)", met: false },
        { label: "Candidate notice & appeal path", met: true },
      ],
      rationaleOverlay: "Employment is a high risk use under the Act; anti-discrimination and bias-audit obligations attach to the tool.",
    },
  },
  {
    id: "el05-healthcare-clinical-decision-support",
    labId: "EL-05",
    industry: "healthcare",
    provenance: studied,
    title: "Clinical decision support / triage",
    oneLiner: "It may be a regulated medical device before it's an AI-Act system.",
    context:
      "An AI system supporting clinical triage and decision-making. Beyond the Act, patient-affecting output on health data can make it a regulated medical device (SaMD), a separate, heavier regulatory pathway with clinical-validation obligations.",
    theDecision:
      "Two regimes at once: classify it under the Act and against medical-device rules, because clinical-validation studies and a device regulatory pathway may govern before the Act's obligations even apply.",
    whatMostMiss:
      "Teams run the AI-Act checklist and miss that clinical decision support can be a regulated medical device, the device pathway (validation studies, CE-MDR/SaMD) is the binding constraint, not the Act.",
    stakes: "Treat it as software-only and you skip the clinical-validation study that legally gates patient use.",
    takeaway: "In clinical AI, medical-device rules may bind before the Act does, validate as a device, not just software.",
    sources: [
      "Healthcare / clinical AI compliance (studied)",
      "EU AI Act + medical-device (SaMD / CE-MDR) & clinical-validation overlay (illustrative, not legal advice)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      fnLabel: "Clinical decision support / triage",
      base: "high",
      autonomy: "advisory",
      data: "sensitive",
      impact: "rights",
      overlayLabel: "Medical-device / clinical overlay",
      overlay: [
        { label: "Clinical validation & performance study", met: false },
        { label: "Device regulatory pathway (SaMD / CE-MDR)", met: false },
        { label: "Clinician-in-the-loop override", met: true },
        { label: "PHI safeguards (HIPAA / GDPR-health)", met: true },
      ],
      rationaleOverlay: "Health data with patient-affecting output, medical-device and clinical-validation obligations may apply alongside the Act.",
    },
  },
]);
