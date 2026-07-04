// GAP-08 · Human-in-the-Loop Approval Simulator — use-cases.
// Payload = the industry framing: what the queue items are, the risk-tier guide
// relabeled for the domain, and a default autonomy level. The queue mechanics and
// the throughput/slip math stay universal; the use-case sets the meaning + the tiers.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface Gap08Tier { tier: string; tone: "rose" | "amber" | "emerald"; max: string }
export interface Gap08Payload {
  taskLine: string;
  tiers: Gap08Tier[];
  defaultLevel: number;
}

export const GAP08_USE_CASES: UseCase<Gap08Payload>[] = assertUseCases<Gap08Payload>([
  {
    id: "gap08-lending-credit",
    labId: "GAP-08",
    industry: "financial-services",
    provenance: firstHand,
    title: "Credit decisions — autonomy by fair-lending risk",
    oneLiner: "Auto-approve the clear cases; the thin-file applicant stays with a human.",
    context:
      "An agent processes credit decisions. Autonomy is set by risk tier: clear approvals/denials can auto-decide, but thin-file and borderline applicants — where fair-lending exposure lives — stay with a human.",
    theDecision:
      "Autonomy is gated by fair-lending risk, not throughput appetite. The level that clears the thin-file edge cases is the ceiling, regardless of how much faster full autonomy would be.",
    whatMostMiss:
      "Teams set one global autonomy level. On credit the tier matters: a thin-file auto-denial that a human would have caught is exactly the disparate-impact pattern regulators look for.",
    stakes: "One auto-decided thin-file case that should have been reviewed is a fair-lending exposure, not a throughput win.",
    takeaway: "On credit, autonomy is gated by fair-lending risk — thin-file cases stay with a human.",
    sources: [
      "Credit-decisioning autonomy / fair-lending (ECOA) controls — first-hand (cards & lending)",
      "Risk-tiered human-in-the-loop policy design",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "An agent processes 20 credit decisions; four are thin-file edge cases.",
      tiers: [
        { tier: "High-risk (credit · fair lending)", tone: "rose", max: "L1–L2" },
        { tier: "Borderline / thin-file", tone: "amber", max: "L3" },
        { tier: "Clear approve / deny", tone: "emerald", max: "L4–L5" },
      ],
      defaultLevel: 2,
    },
  },
  {
    id: "gap08-content-moderation",
    labId: "GAP-08",
    industry: "media",
    provenance: studied,
    title: "Content moderation — the throughput-vs-harm curve",
    oneLiner: "Over-automate and a borderline post slips through as harm.",
    context:
      "A moderation agent processes flagged posts. High-harm content auto-removes and clearly-benign content auto-approves, but the borderline, context-dependent cases are where over-automation lets harm through.",
    theDecision:
      "The dial is throughput vs harm: the level that still routes the borderline cases to a human is the ceiling — one step further trades a harm incident for a little more speed.",
    whatMostMiss:
      "People tune moderation autonomy for cost. The borderline tier is where the harm actually is; automating it is where a moderation program gets its worst headlines.",
    stakes: "A single over-automated borderline case that should have been reviewed is a trust-and-safety incident.",
    takeaway: "In moderation, the dial is throughput vs harm — the borderline cases are where autonomy hurts.",
    sources: [
      "Trust-and-safety moderation autonomy patterns",
      "Harm-severity-tiered review policy",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "A moderation agent processes 20 flagged posts; four are harm edge cases.",
      tiers: [
        { tier: "High-harm (threats, CSAM)", tone: "rose", max: "L1–L2" },
        { tier: "Borderline / context-dependent", tone: "amber", max: "L3" },
        { tier: "Clearly benign", tone: "emerald", max: "L4–L5" },
      ],
      defaultLevel: 2,
    },
  },
  {
    id: "gap08-clinical-orders",
    labId: "GAP-08",
    industry: "healthcare",
    provenance: studied,
    title: "Clinical orders — acuity as the autonomy dial",
    oneLiner: "Low-acuity orders auto-file; high-acuity always waits for a clinician.",
    context:
      "An agent triages AI-suggested orders. Low-acuity, routine orders can auto-file, but high-acuity orders always route to a clinician — acuity, not volume, sets the autonomy level.",
    theDecision:
      "Acuity is the autonomy dial: the ceiling is the level that still holds every high-acuity order for a human, no matter the throughput cost.",
    whatMostMiss:
      "The instinct is to raise autonomy uniformly to clear the queue. In clinical the tier is everything — a high-acuity order that auto-files is a patient-safety event, not a metric.",
    stakes: "One auto-filed high-acuity order that should have waited for a clinician is a safety event.",
    takeaway: "In clinical, acuity is the autonomy dial — high-acuity orders never auto-file.",
    sources: [
      "Clinical decision-support autonomy / acuity-tiered oversight",
      "Order-entry human-in-the-loop safety patterns",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "An agent triages 20 AI-suggested orders; four are high-acuity edge cases.",
      tiers: [
        { tier: "High-acuity (never auto-file)", tone: "rose", max: "L1–L2" },
        { tier: "Moderate acuity", tone: "amber", max: "L3" },
        { tier: "Low-acuity / routine", tone: "emerald", max: "L4–L5" },
      ],
      defaultLevel: 2,
    },
  },
]);
