// EL-01 · Adoption & Change Readiness, use cases.
// Payload = an industry scenario: a population + the six readiness-factor defaults.
// The same weighted composite + gate + plan engine scores it. Defaults are tuned so
// each lands on a distinct, credible verdict (hospital → Hold on trust; contact
// center → conditional on incentives; field → Hold on workflow/comms).

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export type EL01FactorKey = "sponsorship" | "workflow" | "trust" | "training" | "incentives" | "comms";
export type EL01Factors = Record<EL01FactorKey, number>;
export interface EL01Payload {
  people: number;
  defaults: EL01Factors;
}

export const EL01_USE_CASES: UseCase<EL01Payload>[] = assertUseCases<EL01Payload>([
  {
    id: "el01-hospital-scribe",
    labId: "EL-01",
    industry: "healthcare",
    provenance: studied,
    title: "Ambient scribe for 2,000 clinicians",
    oneLiner: "The model works; the clinicians don't trust it yet.",
    context:
      "A health system pilots an ambient AI scribe for 2,000 clinicians. Note quality is good in the demo, but physicians distrust auto-generated notes they're legally accountable for, and nothing in the comp model rewards using it.",
    theDecision:
      "Gate on trust and workflow-fit, not accuracy. At a composite in the high-50s this is a Hold, scaling now burns clinician goodwill you can't re-buy.",
    whatMostMiss:
      "Everyone optimizes the model's word-error rate; adoption dies on 'I'm liable for this note and I didn't write it.' Trust and a clean override are the real ramp.",
    stakes: "A failed clinical rollout doesn't just waste spend, it poisons the next three AI initiatives with the medical staff.",
    takeaway: "In clinical adoption, the gate is trust and liability, not the demo's accuracy.",
    sources: [
      "Ambient clinical-documentation adoption patterns",
      "Clinician trust / note-liability and override literature",
    ],
    lastVerified: "2026-07-03",
    payload: {
      people: 2000,
      defaults: { sponsorship: 72, trust: 46, workflow: 58, training: 55, comms: 60, incentives: 40 },
    },
  },
  {
    id: "el01-contact center-assist",
    labId: "EL-01",
    industry: "financial-services",
    provenance: firstHand,
    title: "Agent-assist for 900 servicing reps",
    oneLiner: "Handle-time scorecards quietly punish the reps who use it.",
    context:
      "A card-servicing operation rolls agent-assist to 900 reps. Sponsorship is strong and the tool fits the desktop, but the incentive scorecard still rewards raw handle time, so the best reps who slow down to use the assist look worse.",
    theDecision:
      "Conditional go: scale in parallel with fixing the scorecard. The incentive misalignment, not the tech, is the factor holding the composite under Scale.",
    whatMostMiss:
      "Adoption is a comp-plan problem in disguise. If the scorecard punishes the behavior you want, no amount of training moves the needle.",
    stakes: "Reps optimize to the metric they're paid on; a misaligned scorecard silently kills usage while every dashboard looks green.",
    takeaway: "Fix the scorecard before the training deck, reps adopt what they're paid to adopt.",
    sources: [
      "Contact center agent-assist rollout, firsthand (card servicing, American Express)",
      "Incentive-alignment change-management practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      people: 900,
      defaults: { sponsorship: 78, trust: 52, workflow: 64, training: 60, comms: 66, incentives: 45 },
    },
  },
  {
    id: "el01-utilities-field-copilot",
    labId: "EL-01",
    industry: "energy",
    provenance: studied,
    title: "Technician copilot on service trucks",
    oneLiner: "Great tool, no signal, adoption dies in the field.",
    context:
      "A utility deploys an AI copilot to 1,200 field technicians on trucks. The assist is solid, but half the service territory has patchy connectivity and the loop back to HQ is slow, techs stop trusting a tool that spins on a dead zone.",
    theDecision:
      "Hold until workflow-fit (offline-first) and the comms loop are fixed. In the field, connectivity and a fast feedback path are the adoption factors, not training.",
    whatMostMiss:
      "Office pilots assume connectivity. In the field the make-or-break factors are offline resilience and whether a tech's reported bug gets fixed before they give up on it.",
    stakes: "A field workforce that abandons a tool in month one is nearly impossible to re-engage, the second rollout starts from negative trust.",
    takeaway: "Field adoption is won on offline resilience and a fast fix-loop, not the demo.",
    sources: [
      "Field-service AI adoption patterns (connectivity, offline-first)",
      "Deskless-workforce change-management literature",
    ],
    lastVerified: "2026-07-03",
    payload: {
      people: 1200,
      defaults: { sponsorship: 68, trust: 55, workflow: 50, training: 52, comms: 48, incentives: 55 },
    },
  },
]);
