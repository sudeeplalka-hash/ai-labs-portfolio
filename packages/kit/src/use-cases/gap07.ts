// GAP-07 · Protocol Selection Lab, use cases.
// Payload = a preset of the six integration answers. The scorer is deterministic,
// so the answers are tuned to land the intended verdict: bank → hybrid (MCP+A2A),
// startup → function calling, supply chain → A2A.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface Gap07Payload {
  answers: Record<string, number>; // q1..q6, each 0 to 2
}

export const GAP07_USE_CASES: UseCase<Gap07Payload>[] = assertUseCases<Gap07Payload>([
  {
    id: "gap07-bank-hybrid",
    labId: "GAP-07",
    industry: "financial-services",
    provenance: firstHand,
    title: "Enterprise bank, MCP core + A2A",
    oneLiner: "40 systems and many agent teams, the two-layer stack wins.",
    context:
      "A bank has 40+ internal systems and multiple agent teams (fraud, servicing, wealth) under central governance. It needs MCP to expose tools vertically and A2A to coordinate agents horizontally.",
    theDecision:
      "Hybrid at enterprise scale: MCP on the tool axis, A2A on the agent axis, under central policy, each protocol on the axis it's built for.",
    whatMostMiss:
      "Teams debate MCP vs A2A as if it's either/or. At bank scale you have both problems; the answer is the two-layer stack, not a winner.",
    stakes: "Picking one protocol at enterprise scale re-litigates the architecture the moment the other axis grows.",
    takeaway: "At enterprise scale it's not MCP vs A2A, it's both, each on its axis.",
    sources: [
      "Enterprise agent architecture, firsthand (financial services, American Express)",
      "MCP + A2A two-layer stack patterns",
    ],
    lastVerified: "2026-07-03",
    payload: { answers: { q1: 2, q2: 2, q3: 2, q4: 2, q5: 1, q6: 2 } },
  },
  {
    id: "gap07-startup-fc",
    labId: "GAP-07",
    industry: "technology",
    provenance: studied,
    title: "Startup, two tools, ship this quarter",
    oneLiner: "One agent, two tools, a protocol is premature.",
    context:
      "A startup has one agent and two tools and needs to ship this quarter. Function calling is enough; an MCP or A2A layer is overhead with no payoff yet.",
    theDecision:
      "Function calling, don't over-build. A protocol layer earns its keep at N×M scale, not at two tools and one consumer.",
    whatMostMiss:
      "Engineers reach for the impressive protocol because it's in the discourse. At this scale it's pure overhead that slows the ship date.",
    stakes: "Over-architecting a two-tool agent burns the runway you needed to ship.",
    takeaway: "At two tools and one agent, function calling wins, a protocol is premature.",
    sources: [
      "Early-stage agent integration (function calling)",
      "Premature-abstraction / over-engineering avoidance",
    ],
    lastVerified: "2026-07-03",
    payload: { answers: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0 } },
  },
  {
    id: "gap07-supplychain-a2a",
    labId: "GAP-07",
    industry: "logistics",
    provenance: studied,
    title: "Supply chain, cross-org agent negotiation",
    oneLiner: "A buyer's agent negotiating with suppliers' agents, A2A is the axis.",
    context:
      "A buyer's agent negotiates with suppliers' agents across organizational boundaries. There's no central governance and few shared tools, the work is agent-to-agent coordination, so A2A is the axis.",
    theDecision:
      "A2A: the work is horizontal coordination between independent agents across orgs, not tool access under one roof, exactly what A2A is for.",
    whatMostMiss:
      "People default to MCP because it's the tool-integration story. Cross-org negotiation has no central tool surface; the protocol you need is the agent-coordination one.",
    stakes: "Forcing an MCP/tool frame on a cross-org negotiation misses that there's no central authority to host the tools.",
    takeaway: "Cross-org coordination is the A2A axis, there's no central tool surface to MCP.",
    sources: [
      "Cross-org agent coordination / negotiation (A2A)",
      "Supply-chain multi-party agent patterns",
    ],
    lastVerified: "2026-07-03",
    payload: { answers: { q1: 1, q2: 1, q3: 2, q4: 0, q5: 0, q6: 1 } },
  },
]);
