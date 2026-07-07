// EL-09 · Resource Onboarding & KT Tracker, use cases.
// Payload = a different mobilization: the resource roster (role / location /
// access-provisioning days) and the knowledge-transfer map (areas × bus-factor)
// for a departing senior. The ramp math, access bottleneck, carrying cost, and
// SPOF detection all recompute from it.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface El09Resource { key: string; role: string; loc: "Onshore" | "Offshore"; access: number }
export interface El09Area { area: string; bus: number }
export interface El09Payload {
  resources: El09Resource[];
  ktAreas: El09Area[];
  ktRoleLabel: string; // header for the KT panel
}

export const EL09_USE_CASES: UseCase<El09Payload>[] = assertUseCases<El09Payload>([
  {
    id: "el09-global-si-pod-mobilization",
    labId: "EL-09",
    industry: "consulting",
    provenance: firstHand,
    title: "Global SI delivery pod mobilization",
    oneLiner: "Offshore client system clearance is the longest pole, and it's not on the training plan.",
    context:
      "Mobilizing a delivery pod for a client engagement. Training isn't the bottleneck; offshore access to client systems (security clearance, VPN, badged accounts) is the longest pole, and it silently carries cost while people wait.",
    theDecision:
      "Pre provision client access before day one: the SI mobilization bottleneck is offshore client system clearance, so start it at contract signature, every day of provisioning is a day of carrying cost with zero output.",
    whatMostMiss:
      "Mobilization plans schedule training and assume access appears. In a global SI, client security provisioning for offshore staff is the critical path and starts the day the SOW is signed, not the day people arrive.",
    stakes: "Two offshore engineers idle three weeks on access is pure carrying cost against a fixed price margin.",
    takeaway: "In SI mobilization, offshore client access clearance is the critical path, start it at signature, not day one.",
    sources: [
      "Global-SI engagement mobilization (firsthand, consulting delivery)",
      "Onshore/offshore access-provisioning as the ramp bottleneck",
    ],
    lastVerified: "2026-07-03",
    payload: {
      ktRoleLabel: "Rolling off in 4 weeks · Engagement Lead",
      resources: [
        { key: "lead", role: "Engagement Lead", loc: "Onshore", access: 5 },
        { key: "seng", role: "Senior Engineer", loc: "Offshore", access: 20 },
        { key: "genai", role: "GenAI Engineer", loc: "Offshore", access: 22 },
        { key: "data", role: "Data Engineer", loc: "Onshore", access: 8 },
        { key: "pm", role: "Delivery PM", loc: "Onshore", access: 4 },
        { key: "sme", role: "Client SME (badged)", loc: "Onshore", access: 10 },
      ],
      ktAreas: [
        { area: "Client stakeholder map", bus: 1 },
        { area: "Solution blueprint", bus: 2 },
        { area: "Estimation model", bus: 1 },
        { area: "Delivery playbook", bus: 2 },
        { area: "Client access matrix", bus: 1 },
      ],
    },
  },
  {
    id: "el09-travel-program-mobilization",
    labId: "EL-09",
    industry: "travel",
    provenance: studied,
    title: "Travel program mobilization",
    oneLiner: "Booking system and PCI access gate the ramp, and the SME who holds it is leaving.",
    context:
      "Mobilizing for a travel/hospitality AI program against a seasonal deadline. Access to booking systems (GDS) and PCI scoped environments is the pole, and the booking systems SME who understands the integrations is rolling off soon.",
    theDecision:
      "Two clocks at once: pre provision the PCI/booking system access to start ramps, and schedule KT from the departing SME now, the seasonal date means there's no slack to absorb either delay.",
    whatMostMiss:
      "Teams treat access and KT as separate chores. In travel, both run through the same scarce booking systems knowledge under a seasonal deadline, sequence them together or the ramp and the departure collide.",
    stakes: "Lose the booking systems SME before KT and the integration knowledge walks out ahead of peak season.",
    takeaway: "In travel mobilization, booking/PCI access and the SME's KT share one clock, run them in parallel before peak.",
    sources: [
      "Travel / hospitality program mobilization (studied)",
      "PCI / booking-system access provisioning and KT sequencing",
    ],
    lastVerified: "2026-07-03",
    payload: {
      ktRoleLabel: "Rolling off in 5 weeks · Booking systems SME",
      resources: [
        { key: "lead", role: "Program Lead", loc: "Onshore", access: 5 },
        { key: "be", role: "Backend Engineer", loc: "Offshore", access: 16 },
        { key: "ml", role: "ML Engineer", loc: "Offshore", access: 19 },
        { key: "sme", role: "Booking systems SME", loc: "Onshore", access: 12 },
        { key: "data", role: "Data Engineer", loc: "Onshore", access: 9 },
        { key: "qa", role: "QA / Eval", loc: "Offshore", access: 21 },
      ],
      ktAreas: [
        { area: "GDS / booking integration", bus: 1 },
        { area: "Fare & inventory data contracts", bus: 1 },
        { area: "Personalization pipeline", bus: 2 },
        { area: "PCI handling runbook", bus: 1 },
        { area: "Peak load playbook", bus: 2 },
      ],
    },
  },
  {
    id: "el09-fintech-feature-mobilization",
    labId: "EL-09",
    industry: "financial-services",
    provenance: studied,
    title: "Fintech feature team mobilization",
    oneLiner: "Prod data and compliance access gate the ramp; the founding engineer holds every runbook.",
    context:
      "A fintech scaling a lending/payments AI feature. Production data and compliance environment access are the ramp bottleneck, and, the sharper risk, the founding ML engineer is the single point of failure across most of the stack and is rolling off fast.",
    theDecision:
      "Fix the bus factor before the access: pre provisioning helps the ramp, but the existential risk is a founding engineer who's the only owner of the pipeline, feature store, and fraud rules, schedule KT with named backups now.",
    whatMostMiss:
      "Scale ups celebrate the hero engineer and miss that heroism is concentration risk. When one person owns the training pipeline, the feature store, and the fraud rules, their departure is an outage waiting to happen.",
    stakes: "Lose the founding engineer before KT and the fraud rules and training pipeline have no owner overnight.",
    takeaway: "In a fintech, the founding engineer's bus factor is the real risk, capture the knowledge before the ramp math.",
    sources: [
      "Fintech / financial-services feature-team mobilization (studied)",
      "Bus-factor / single-point-of-failure knowledge capture",
    ],
    lastVerified: "2026-07-03",
    payload: {
      ktRoleLabel: "Rolling off in 3 weeks · Founding ML Engineer",
      resources: [
        { key: "lead", role: "Tech Lead", loc: "Onshore", access: 4 },
        { key: "be", role: "Backend Engineer", loc: "Onshore", access: 7 },
        { key: "ml", role: "ML Engineer", loc: "Offshore", access: 18 },
        { key: "data", role: "Data Engineer", loc: "Offshore", access: 20 },
        { key: "comp", role: "Compliance Analyst", loc: "Onshore", access: 11 },
        { key: "sre", role: "SRE", loc: "Onshore", access: 9 },
      ],
      ktAreas: [
        { area: "Model training pipeline", bus: 1 },
        { area: "Feature store", bus: 1 },
        { area: "Prod inference stack", bus: 2 },
        { area: "Fraud rules & thresholds", bus: 1 },
        { area: "Compliance model docs", bus: 1 },
      ],
    },
  },
]);
