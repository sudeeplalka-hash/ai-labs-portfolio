// GAP-03 · Multiagent Orchestration Board, use cases.
// Payload = an industry-specific preset the board swaps in (goal + agents +
// A2A messages + assembled result + single/multi metrics). Roles stay the four
// canonical lanes; the work inside them is industry-specific.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export type Gap03Role = "Researcher" | "Analyst" | "Writer" | "Critic";
export interface Gap03Agent { role: Gap03Role; task: string; output: string }
export interface Gap03Msg { from: string; to: string; label: string }
export interface Gap03Metrics { quality: number; costUsd: number; latencyS: number }
export interface Gap03Payload {
  goal: string;
  agents: Gap03Agent[];
  messages: Gap03Msg[];
  assembled: string[];
  single: Gap03Metrics;
  multi: Gap03Metrics;
}

export const GAP03_USE_CASES: UseCase<Gap03Payload>[] = assertUseCases<Gap03Payload>([
  {
    id: "gap03-legal-msa-swarm",
    labId: "GAP-03",
    industry: "legal",
    provenance: studied,
    title: "Contract-review swarm on an MSA",
    oneLiner: "A four-agent swarm redlines a vendor MSA, the critic earns its keep.",
    context:
      "A corporate legal team runs ~400 vendor MSAs a quarter. A single agent misses cross-references; the swarm splits it, a clause-extractor pulls terms, a risk-scorer flags liability/indemnity/termination, a redliner proposes edits, and a citation-checker verifies every claim against the firm's playbook.",
    theDecision:
      "Multiagent buys ~30% higher risk-catch on this class for ~2.4× cost and latency. Trivially worth it on a $2M MSA; not on a $5k click-through.",
    whatMostMiss:
      "The value isn't the extra agents, it's the critic. Without an adversarial reviewer, a swarm just produces confident, un-cited redlines faster.",
    stakes: "One missed auto-renewal or uncapped-liability clause dwarfs a year of inference cost.",
    takeaway: "I add agents where a critic changes the outcome, not where it adds motion.",
    sources: [
      "Commercial-contracting norms, MSA structure, indemnity/liability/termination clauses",
      "Public legal-AI product patterns, clause extraction + playbook checks",
    ],
    lastVerified: "2026-07-03",
    payload: {
      goal: "Review a vendor Master Services Agreement and return a playbook-cited redline.",
      agents: [
        { role: "Researcher", task: "Extract the operative clauses (term, liability, indemnity, IP, termination).", output: "27 clauses extracted; liability cap and auto-renewal isolated for scoring." },
        { role: "Analyst", task: "Score each clause against the risk playbook.", output: "Uncapped indemnity + 90-day auto-renewal flagged high; SLA credits below floor." },
        { role: "Writer", task: "Draft redlines for the high risk clauses.", output: "Proposed a liability cap at 12 months' fees and a 30-day opt-out on renewal." },
        { role: "Critic", task: "Verify every redline cites a playbook clause; kill unsupported edits.", output: "Rejected one stylistic edit with no playbook basis; confirmed the two material ones." },
      ],
      messages: [
        { from: "Supervisor", to: "Researcher", label: "assign · extract clauses" },
        { from: "Researcher", to: "Analyst", label: "handoff · clause set" },
        { from: "Analyst", to: "Writer", label: "handoff · risk flags" },
        { from: "Writer", to: "Critic", label: "review request · redlines" },
        { from: "Critic", to: "Supervisor", label: "return · cited & trimmed" },
      ],
      assembled: [
        "Two material redlines: cap liability at 12 months' fees; 30-day opt-out on the auto-renewal.",
        "Every proposed edit cites the playbook clause it enforces, auditable for counsel sign off.",
        "One un-cited stylistic edit was killed by the critic before it reached the partner.",
      ],
      single: { quality: 62, costUsd: 0.019, latencyS: 4.4 },
      multi: { quality: 81, costUsd: 0.046, latencyS: 10.6 },
    },
  },
  {
    id: "gap03-pharma-phase2-ci",
    labId: "GAP-03",
    industry: "pharma",
    provenance: studied,
    title: "Competitive-intel brief on a Phase II readout",
    oneLiner: "Four agents turn a rival's trial data into a defensible brief.",
    context:
      "A pharma competitive-intelligence team must brief leadership on a rival's Phase II readout within 48 hours. A researcher pulls the trial registry, press, and KOL commentary; an analyst reconciles the reported endpoints against the label ambition; a medical writer drafts; and a regulatory critic checks every claim against what the data actually supports.",
    theDecision:
      "Multiagent is worth the multiple only for high-stakes synthesis like this, where a wrong read moves a portfolio decision. Routine literature scans stay single-agent.",
    whatMostMiss:
      "The regulatory critic is the difference between 'intel' and 'a claim our own medical team can't defend.' Speed without the critic manufactures confident errors.",
    stakes: "A misread efficacy signal can misdirect a go/no-go on a program worth hundreds of millions.",
    takeaway: "On high-stakes synthesis, the critic isn't overhead, it's the brief's credibility.",
    sources: [
      "Clinical-trial reporting norms, ClinicalTrials.gov, Phase II endpoint conventions",
      "Pharma competitive-intelligence workflow patterns (registry + KOL synthesis)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      goal: "Brief leadership on a competitor's Phase II readout in 48 hours.",
      agents: [
        { role: "Researcher", task: "Assemble the registry entry, press release, and KOL commentary.", output: "Primary endpoint met; two secondaries missed; KOLs split on durability." },
        { role: "Analyst", task: "Reconcile the reported endpoints against their label ambition.", output: "Signal supports a narrow indication, not the broad label their PR implies." },
        { role: "Writer", task: "Draft the three things leadership must know.", output: "Drafted: real signal, over-claimed scope, and the readout we should watch next." },
        { role: "Critic", task: "Check each claim against what the data actually supports.", output: "Softened 'efficacy confirmed' to 'primary met, durability unproven'; cited the miss." },
      ],
      messages: [
        { from: "Supervisor", to: "Researcher", label: "assign · pull trial data" },
        { from: "Researcher", to: "Analyst", label: "handoff · endpoints + KOLs" },
        { from: "Analyst", to: "Writer", label: "handoff · scope read" },
        { from: "Writer", to: "Critic", label: "review request · draft brief" },
        { from: "Critic", to: "Supervisor", label: "return · claims tightened" },
      ],
      assembled: [
        "Real signal: primary endpoint met, but on a narrow indication, not the broad label their PR implies.",
        "Two secondary endpoints missed; durability is unproven pending the Phase III design.",
        "Watch: their end-of-Phase-II meeting outcome, it sets whether the broad claim survives.",
      ],
      single: { quality: 59, costUsd: 0.022, latencyS: 4.9 },
      multi: { quality: 80, costUsd: 0.055, latencyS: 11.5 },
    },
  },
  {
    id: "gap03-capmkts-research-swarm",
    labId: "GAP-03",
    industry: "capital-markets",
    provenance: firstHand,
    title: "Equity-research swarm on an investment thesis",
    oneLiner: "Analyst, risk, and a compliance critic pressure-test a thesis.",
    context:
      "A markets research desk drafts a thesis on a covered name ahead of an earnings print. A research agent assembles filings, transcripts, and consensus; a risk agent stress-tests the downside and the crowded-trade angle; a writer drafts the note; and a compliance critic checks every claim for MNPI, selective disclosure, and unsupported price-target language.",
    theDecision:
      "The compliance critic is non-negotiable in a regulated research function, it's a surveillance control, not a nicety. That's what justifies the multiagent cost here.",
    whatMostMiss:
      "In markets the risk isn't a weak thesis, it's a well-argued note that trips a disclosure or MNPI line. The critic is the control that keeps research publishable.",
    stakes: "A single compliance slip in published research is a regulatory and franchise event; the inference cost is a rounding error against it.",
    takeaway: "In regulated research, the critic is the surveillance layer, the cost buys defensibility.",
    sources: [
      "Sell-side research supervision norms, MNPI, Reg FD, price-target substantiation",
      "Capital-markets research workflow, firsthand (Morgan Stanley; S&P Global / CRISIL)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      goal: "Draft a publishable research note on a covered name ahead of earnings.",
      agents: [
        { role: "Researcher", task: "Assemble filings, transcripts, and consensus estimates.", output: "Consensus is above guidance on margin; two analysts flag channel risk." },
        { role: "Analyst", task: "Stress-test the downside and the crowded-trade angle.", output: "Thesis holds on units but is crowded; downside is a margin miss, not demand." },
        { role: "Writer", task: "Draft the note with a rated price target.", output: "Drafted an Overweight with a target bridged from the margin path." },
        { role: "Critic", task: "Check for MNPI, Reg FD, and unsupported target language.", output: "Flagged an un-sourced channel-check claim; required a public citation before publish." },
      ],
      messages: [
        { from: "Supervisor", to: "Researcher", label: "assign · gather inputs" },
        { from: "Researcher", to: "Analyst", label: "handoff · consensus + filings" },
        { from: "Analyst", to: "Writer", label: "handoff · stress test" },
        { from: "Writer", to: "Critic", label: "review request · rated note" },
        { from: "Critic", to: "Supervisor", label: "return · compliance-cleared" },
      ],
      assembled: [
        "Thesis: Overweight on units, but the trade is crowded, the risk is a margin miss, not demand.",
        "Price target bridged transparently from the margin path, not asserted.",
        "The critic blocked an un-sourced channel-check claim until it was backed by a public citation.",
      ],
      single: { quality: 61, costUsd: 0.020, latencyS: 4.6 },
      multi: { quality: 82, costUsd: 0.049, latencyS: 10.9 },
    },
  },
]);
