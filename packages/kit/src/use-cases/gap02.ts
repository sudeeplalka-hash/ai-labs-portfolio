// GAP-02 · Agent Loop & Failure Inspector, use cases.
// Payload = a self-contained ReAct trace for the industry task, with its
// characteristic failure → detection → recovery baked in. When a use case is
// active the architecture/failure selectors hide and the authored trace plays.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export type Gap02Role = "thought" | "action" | "observation" | "failure" | "detect" | "recover" | "final";
export interface Gap02Step { role: Gap02Role; label: string; detail?: string }
export interface Gap02Payload {
  taskLine: string;
  base: Gap02Step[];
}

export const GAP02_USE_CASES: UseCase<Gap02Payload>[] = assertUseCases<Gap02Payload>([
  {
    id: "gap02-insurance-fnol",
    labId: "GAP-02",
    industry: "insurance",
    provenance: studied,
    title: "FNOL triage, the validation gate as fraud control",
    oneLiner: "A hallucinated policy number gets rejected at the gate, which is also a fraud control.",
    context:
      "An FNOL (first-notice-of-loss) triage agent opens claims. It hallucinates a policy number and a fuzzy amount; the schema/entity gate rejects the call and forces a re-ask against the real record.",
    theDecision:
      "The validation gate isn't just hygiene, on claims intake it doubles as a fraud control, because 'unknown policy / non-numeric amount' is exactly what a bad claim looks like.",
    whatMostMiss:
      "Teams treat schema validation as plumbing. On FNOL it's the cheapest fraud signal you have, the same gate that catches a hallucination catches a fabricated claim.",
    stakes: "An auto-opened claim on a hallucinated or fabricated policy is a leakage and fraud exposure, not a bug ticket.",
    takeaway: "On claims intake, the validation gate is a fraud control, reject at the boundary, re-ask against the record.",
    sources: [
      "Insurance FNOL / claims intake automation patterns",
      "Schema/entity validation as a fraud-signal control",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "Task: triage a first-notice-of-loss (FNOL) claim intake.",
      base: [
        { role: "thought", label: "Pull the policy referenced in the claim." },
        { role: "action", label: "get_policy(\"POL-77341\")" },
        { role: "observation", label: "active · auto · deductible $500" },
        { role: "thought", label: "Extract the loss details and open the claim." },
        { role: "action", label: "open_claim(policy=\"POL-99999\", loss=\"rear collision\", amount=\"around 4k\")" },
        { role: "failure", label: "Hallucinated args", detail: "policy POL-99999 not found; amount 'around 4k' is non-numeric" },
        { role: "detect", label: "Detection signal", detail: "Schema + entity validation: unknown policy id, non-numeric amount" },
        { role: "recover", label: "Recovery policy", detail: "Reject at the gate, re-ask with the schema, the same gate is a fraud control" },
        { role: "action", label: "open_claim(policy=\"POL-77341\", loss=\"rear collision\", amount=4000)" },
        { role: "observation", label: "claim CLM-2210 opened" },
        { role: "final", label: "Filed after the gate caught the bad reference. The validation gate is the fraud control." },
      ],
    },
  },
  {
    id: "gap02-cyber-soc-triage",
    labId: "GAP-02",
    industry: "cybersecurity",
    provenance: studied,
    title: "SOC alert triage, breaking the flapping-alert loop",
    oneLiner: "The agent loops on a flapping alert; the loop-breaker caps it and escalates.",
    context:
      "A SOC triage agent investigates a flapping alert source and re-queries it repeatedly with no new information. The loop detector caps iterations, suppresses the source, and escalates with the transcript.",
    theDecision:
      "The trade is observability spend vs analyst alert-fatigue: the iteration cap and source-suppression cost a little to instrument and buy back a lot of wasted analyst attention.",
    whatMostMiss:
      "People fear the agent doing something wrong; the common failure is it doing the same thing forever. A loop-breaker is cheaper than the analyst hours a flapping source burns.",
    stakes: "An un-capped triage agent on a flapping source burns budget and buries the real alert under noise.",
    takeaway: "Cap the loop and suppress the flapping source, observability spend buys back alert-fatigue.",
    sources: [
      "SOC alert-triage automation patterns",
      "Agent loop detection / iteration-cap recovery",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "Task: triage a stream of SOC alerts.",
      base: [
        { role: "thought", label: "Investigate the top alert." },
        { role: "action", label: "get_alert(\"ALRT-5521\")" },
        { role: "observation", label: "source: edr · signal: suspicious-powershell · flapping" },
        { role: "thought", label: "Re-check the alert source for context." },
        { role: "action", label: "get_alert(\"ALRT-5521\")  // repeat" },
        { role: "action", label: "get_alert(\"ALRT-5521\")  // repeat again" },
        { role: "failure", label: "Infinite loop", detail: "get_alert called ×4 on a flapping source with no new information" },
        { role: "detect", label: "Detection signal", detail: "Monitor: identical action signature repeated ≥3 times" },
        { role: "recover", label: "Recovery policy", detail: "Loop breaker: cap iterations, suppress the flapping source, escalate with the transcript" },
        { role: "action", label: "suppress_source(\"edr:flapping\") · escalate(analyst)" },
        { role: "observation", label: "source suppressed · escalated to tier-2" },
        { role: "final", label: "Loop broken and escalated. Observability spend here buys back analyst alert-fatigue." },
      ],
    },
  },
  {
    id: "gap02-telecom-noc",
    labId: "GAP-02",
    industry: "telecom",
    provenance: firstHand,
    title: "NOC incident correlation, 503 under load",
    oneLiner: "A tool 503s during the incident; retry/backoff plus a cached fallback keeps it moving.",
    context:
      "An NOC agent correlating a network incident hits a 503 on the topology service, overloaded by the very incident it's diagnosing. Retry with backoff, then fall back to the cached topology, flagging staleness.",
    theDecision:
      "Resilience here is a network-SLA duty, not a nicety, the tools you depend on are least available exactly when the incident is worst, so the recovery policy is the design.",
    whatMostMiss:
      "Demos assume tools are up. In a real incident the dependency is overloaded precisely when you need it; the backoff-and-cache path is what keeps the agent useful under load.",
    stakes: "An agent that stalls on a 503 mid-incident extends the outage it was meant to shorten.",
    takeaway: "Under load, resilience is the design, backoff plus a cached fallback is a network-SLA duty.",
    sources: [
      "Telecom NOC incident-correlation workflows, firsthand (Verizon)",
      "Retry/backoff + cached-fallback resilience patterns",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "Task: an NOC agent correlating a network incident under load.",
      base: [
        { role: "thought", label: "Fetch the alarms and the affected elements." },
        { role: "action", label: "get_alarms(region=\"west\")" },
        { role: "observation", label: "3 correlated alarms · fiber cut suspected" },
        { role: "thought", label: "Query the topology service for blast radius." },
        { role: "action", label: "get_topology(\"west-ring-4\")" },
        { role: "failure", label: "Tool error", detail: "get_topology → 503 Service Unavailable (overloaded during the incident)" },
        { role: "detect", label: "Detection signal", detail: "Monitor: non-2xx tool response + latency spike over threshold" },
        { role: "recover", label: "Recovery policy", detail: "Retry ×2 with exponential backoff → fall back to the cached topology; flag staleness" },
        { role: "action", label: "get_topology(cached) → impact: ~2,100 sites" },
        { role: "observation", label: "blast radius scoped from cache" },
        { role: "final", label: "Incident scoped despite the 503. In telecom, resilience is a network-SLA duty." },
      ],
    },
  },
]);
