import type { StageKey } from "./types";

export interface StageDef {
  key: StageKey;
  n: string;
  /** Zone path under the platform domain (Multi-Zones). */
  href: string;
  label: string;
  /** One-word display name for chips, CTAs ("fix in Data →"), and the rail. */
  short: string;
  sub: string;
  question: string;
  raises: string;
  reason: string;
  will: string;
}

// The program spine (BRIEF §3). Single source of truth for nav, gating, and copy.
// Stage-04/07 vocabulary settled 2026-07-11 (R1.2): 04 = "Deploy · AI Ops"
// (make it run), 07 = "Operate · Day Two" (keep it running). Applied here once;
// sidebar, stepper, PageIntro, titles, and handoffs all read this list.
export const STAGES: StageDef[] = [
  { key: "frame", n: "01", href: "/frame", label: "Strategy & Planning", short: "Strategy", sub: "why",
    question: "Is this worth doing?", raises: "Can we feed it?", reason: "You're here.",
    will: "Frame the use case. Score the opportunity. Create the initiative brief." },
  { key: "data", n: "02", href: "/data", label: "Data", short: "Data", sub: "fuel",
    question: "Can we feed it?", raises: "Does the system work?",
    reason: "Frame a bet first, then we test whether your data can feed it.",
    will: "Assess the fuel: profile sources, score readiness, and puncture the framing readiness guess." },
  { key: "build", n: "03", href: "/build", label: "Build · RAG", short: "Build", sub: "engine",
    question: "Does the system work?", raises: "Can we trust it in production?",
    reason: "Need a scoped bet and ready enough data before proving the engine.",
    will: "Prove the engine: retrieval + generation on a real document, scored for faithfulness and citations." },
  { key: "deploy", n: "04", href: "/deploy", label: "Deploy · AI Ops", short: "Deploy", sub: "make it run",
    question: "Does it run reliably at cost?", raises: "Is it safe to run?",
    reason: "Prove the engine works before running it reliably.",
    will: "Ship it safely, day 0/1: release readiness, cost per query scaling, latency, rollback capability, and the instrumentation you'll live on." },
  { key: "govern", n: "05", href: "/govern", label: "Govern", short: "Govern", sub: "trust",
    question: "Is it safe to run?", raises: "What is it actually worth?",
    reason: "Prove it runs reliably first, then put the controls around it.",
    will: "Risk tiering, policy as code, runtime guardrails, red team evals, and the audit evidence behind every decision." },
  { key: "realize", n: "06", href: "/realize", label: "Realize", short: "Realize", sub: "payoff",
    question: "What is it actually worth?", raises: "Is it still working?",
    reason: "Govern the system first, then count the value it creates.",
    will: "The payoff: a risk adjusted business case where every number traces back to an upstream decision." },
  { key: "operate", n: "07", href: "/operate", label: "Operate · Day Two", short: "Operate", sub: "keep it running",
    question: "Is it still working?", raises: "Re frame the next cycle.",
    reason: "Placed after Realize, scoped from Deploy onward, day two begins the moment you ship.",
    will: "The loop: drift and staleness against green SLOs, one day two incident, and the retrain / reindex / rollback / rescope call that feeds the next Frame." },
];

export const STAGE_MAP: Record<StageKey, StageDef> = STAGES.reduce(
  (acc, s) => { acc[s.key] = s; return acc; },
  {} as Record<StageKey, StageDef>,
);
