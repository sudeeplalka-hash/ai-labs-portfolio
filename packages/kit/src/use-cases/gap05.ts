// GAP-05 · Context & Memory Engineering, use cases.
// Payload = a preset turn count + default view + an industry fact set for the
// "what survives" memory table. The four-strategy cost/fidelity comparison is
// turn-driven and universal; the use case sets the regime and the facts.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface Gap05Fact { t: number; f: string; key: boolean; rel: boolean }
export interface Gap05Payload {
  taskLine: string;
  turns: number;
  view: "compare" | "memory";
  facts: Gap05Fact[];
}

export const GAP05_USE_CASES: UseCase<Gap05Payload>[] = assertUseCases<Gap05Payload>([
  {
    id: "gap05-saas-support-thread",
    labId: "GAP-05",
    industry: "technology",
    provenance: studied,
    title: "A 40-turn support thread across two sessions",
    oneLiner: "As the thread grows, summarize beats full dump on cost and overflow.",
    context:
      "A SaaS support conversation runs 40 turns across two sessions. Full dump keeps everything but its cost and overflow risk climb every turn; a rolling summary keeps the key facts at flat cost.",
    theDecision:
      "Strategy is a function of session length: for a long support thread, summarize (or compress), full dump is only right for a short, high stakes exchange.",
    whatMostMiss:
      "Teams pick one context strategy and standardize it. The right choice changes with the task, a long thread and a short one want different dials.",
    stakes: "Full dumping a long thread quietly triples the token bill and risks a window overflow mid conversation.",
    takeaway: "For a long thread, summarize, full dump's cost and overflow climb with every turn.",
    sources: [
      "Multi-session support-thread context strategies",
      "Rolling-summary vs full-context cost/fidelity trade-offs",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "A 40-turn support thread continued across two sessions.",
      turns: 9,
      view: "compare",
      facts: [
        { t: 1, f: "Ticket #4821 · billing", key: true, rel: true },
        { t: 1, f: "Plan: Team, 40 seats", key: true, rel: true },
        { t: 2, f: "Error: invoice mismatch", key: true, rel: true },
        { t: 3, f: "Repro steps confirmed", key: true, rel: true },
        { t: 4, f: "User timezone PST", key: false, rel: false },
        { t: 5, f: "Prefers Slack updates", key: false, rel: false },
      ],
    },
  },
  {
    id: "gap05-legal-ediscovery",
    labId: "GAP-05",
    industry: "legal",
    provenance: studied,
    title: "50k document e discovery under budget",
    oneLiner: "At corpus scale, compress or hand off, full dump is off the table.",
    context:
      "Reviewing a 50,000 document e discovery corpus under a fixed budget. Full dump is impossible; the real choice is between semantic compression and handing slices to subagents that each carry only their brief.",
    theDecision:
      "At corpus scale the dial is compress vs subagent handoff, both stay in budget; the choice is whether cross document reasoning (compress) or parallel throughput (handoff) matters more.",
    whatMostMiss:
      "People debate summarize vs full dump; at 50k docs that's not the axis. The scale question is compression fidelity vs handoff coordination cost.",
    stakes: "The wrong strategy at corpus scale either blows the review budget or drops the document that mattered.",
    takeaway: "At corpus scale, the dial is compress vs handoff, full dump isn't a choice you get to make.",
    sources: [
      "E-discovery review at corpus scale (compression, sub-agent partitioning)",
      "Context budgeting for large-corpus tasks",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "Reviewing a 50,000 document e discovery corpus under a budget.",
      turns: 10,
      view: "compare",
      facts: [
        { t: 1, f: "Matter: Acme v. Globex", key: true, rel: true },
        { t: 1, f: "Privilege log rules", key: true, rel: true },
        { t: 2, f: "Relevant date range", key: true, rel: true },
        { t: 3, f: "Custodian: CFO", key: true, rel: true },
        { t: 4, f: "Doc formats: PST + PDF", key: false, rel: false },
        { t: 5, f: "Reviewer notes style", key: false, rel: false },
      ],
    },
  },
  {
    id: "gap05-wealth-continuity",
    labId: "GAP-05",
    industry: "capital-markets",
    provenance: firstHand,
    title: "Client goals across quarterly reviews",
    oneLiner: "The memory policy is the relationship, what survives between reviews.",
    context:
      "An advisory assistant carries a client's goals and constraints across quarterly reviews. The 'what survives' table is the point: the memory policy decides whether the client feels remembered or re interviewed each quarter.",
    theDecision:
      "Here memory policy is relationship continuity, the key facts (goals, risk tolerance, constraints) must persist across sessions even as the incidental chatter is evicted.",
    whatMostMiss:
      "Everyone tunes context for cost. In advisory the memory policy is a client experience decision: forgetting the 'no tobacco holdings' constraint isn't a token issue, it's a trust issue.",
    stakes: "An assistant that forgets a stated constraint between reviews erodes the exact trust the relationship runs on.",
    takeaway: "In advisory, the memory policy is the relationship, persist the constraints, evict the chatter.",
    sources: [
      "Wealth-advisory client continuity, firsthand (Morgan Stanley)",
      "Cross-session memory / fact-retention policy design",
    ],
    lastVerified: "2026-07-03",
    payload: {
      taskLine: "Carrying a client's goals and constraints across quarterly reviews.",
      turns: 5,
      view: "memory",
      facts: [
        { t: 1, f: "Goal: retire at 60", key: true, rel: true },
        { t: 1, f: "Risk tolerance: moderate", key: true, rel: true },
        { t: 2, f: "Constraint: no tobacco holdings", key: true, rel: true },
        { t: 3, f: "Liquidity event in Q3", key: true, rel: true },
        { t: 4, f: "Prefers quarterly calls", key: false, rel: false },
        { t: 5, f: "Mentioned a boat purchase", key: false, rel: false },
      ],
    },
  },
]);
