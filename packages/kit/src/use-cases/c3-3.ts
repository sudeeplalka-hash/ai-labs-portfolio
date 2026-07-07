// C3-3 · Inference Cost Forecaster, use cases.
// Payload = an input preset (the six forecast sliders). The same API-vs-self-host
// curve + cliff engine runs it. Presets chosen so the cliff behaves differently:
// consumer social → early cliff; insurance → utilization-bound; telecom → mid-horizon.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface C33Payload {
  startVol: number;
  growth: number;
  tokensPerCall: number;
  frontierShare: number;
  util: number;
  opsFte: number;
}

export const C33_USE_CASES: UseCase<C33Payload>[] = assertUseCases<C33Payload>([
  {
    id: "c33-consumer-social-chat",
    labId: "C3-3",
    industry: "technology",
    provenance: studied,
    title: "A chat feature at tens of millions of DAU",
    oneLiner: "At consumer scale, the self host cliff arrives early.",
    context:
      "A consumer app ships an AI chat feature to tens of millions of daily users. Volume is enormous and compounding, most traffic runs on a cheap model, and the team can keep GPUs busy.",
    theDecision:
      "At this scale the crossover to self host arrives within the first year, pay per token can't compete once utilization is high and volume compounds.",
    whatMostMiss:
      "The API bill looks fine in the pilot and becomes a scary line item by month nine. The cliff is a function of growth × utilization, not today's invoice.",
    stakes: "Staying on usage based pricing past the cliff at consumer scale is a seven figure annual overspend.",
    takeaway: "At consumer scale, forecast the cliff early, the pilot invoice hides it.",
    sources: [
      "Consumer-scale inference cost patterns (high volume chat)",
      "Self-host crossover analysis",
    ],
    lastVerified: "2026-07-03",
    payload: { startVol: 4_000_000, growth: 12, tokensPerCall: 1500, frontierShare: 20, util: 80, opsFte: 2 },
  },
  {
    id: "c33-insurance-claims-docs",
    labId: "C3-3",
    industry: "insurance",
    provenance: studied,
    title: "Document heavy claims processing",
    oneLiner: "Bursty claims volume means idle GPUs, utilization is the whole story.",
    context:
      "An insurer runs document heavy claims through AI, long inputs, moderate volume, but bursty (spikes after weather events). Self host GPUs sit idle between surges.",
    theDecision:
      "Here utilization, not volume, decides. At 40% utilization the idle capacity keeps API ahead; drive utilization up (batch the backlog) and the cliff appears.",
    whatMostMiss:
      "Vendors quote self host at 90% utilization. Bursty workloads run at 40%, the idle GPUs are the cost the pitch omits, and they move the cliff by years.",
    stakes: "Committing to self host for a bursty workload can lock in idle capacity cost that dwarfs the API bill it replaced.",
    takeaway: "For bursty workloads, utilization is the cliff, model it at your real duty cycle, not the vendor's.",
    sources: [
      "Insurance claims AI (document-heavy, bursty volume)",
      "GPU utilization / idle-capacity economics",
    ],
    lastVerified: "2026-07-03",
    payload: { startVol: 800_000, growth: 5, tokensPerCall: 5000, frontierShare: 40, util: 40, opsFte: 1.5 },
  },
  {
    id: "c33-telecom-noc-assistant",
    labId: "C3-3",
    industry: "telecom",
    provenance: firstHand,
    title: "Network ops assistant across NOCs",
    oneLiner: "Portfolio run rate across NOCs, the cliff is real but mid horizon.",
    context:
      "A telecom runs an AI assistant across its network operations centers, steady, always on volume with modest growth. The question is the 24 month portfolio run rate, not the per call price.",
    theDecision:
      "With steady utilization the crossover lands mid horizon; the decision is whether to commit capex now for a cliff that arrives in year two.",
    whatMostMiss:
      "At the portfolio level the question isn't 'is self host cheaper per call', it's whether the two year run rate and the ops headcount to run it beat staying on API.",
    stakes: "A premature self host commitment ties up capex and an ops team before the cliff justifies it.",
    takeaway: "At portfolio scale, the decision is the two year run rate and the ops team, not the sticker price.",
    sources: [
      "Telecom network-ops AI run-rate, firsthand (Verizon)",
      "Portfolio-level inference cost forecasting",
    ],
    lastVerified: "2026-07-03",
    payload: { startVol: 1_500_000, growth: 6, tokensPerCall: 3000, frontierShare: 30, util: 65, opsFte: 2 },
  },
]);
