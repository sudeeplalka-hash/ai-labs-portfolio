import type { StageKey } from "./types";

export interface StageDef {
  key: StageKey;
  n: string;
  /** Zone path under the platform domain (Multi-Zones). */
  href: string;
  label: string;
  sub: string;
  question: string;
  raises: string;
  reason: string;
  will: string;
}

// The program spine (BRIEF §3). Single source of truth for nav, gating, and copy.
export const STAGES: StageDef[] = [
  { key: "frame", n: "01", href: "/frame", label: "Strategy & Planning", sub: "why",
    question: "Is this worth doing?", raises: "Can we feed it?", reason: "You're here.",
    will: "Frame the use case. Score the opportunity. Create the initiative brief." },
  { key: "data", n: "02", href: "/data", label: "Data", sub: "fuel",
    question: "Can we feed it?", raises: "Does the system work?",
    reason: "Frame a bet first — then we test whether your data can feed it.",
    will: "Assess the fuel: profile sources, score readiness, and puncture the framing readiness guess." },
  { key: "build", n: "03", href: "/build", label: "Build · RAG", sub: "engine",
    question: "Does the system work?", raises: "Can we trust it in production?",
    reason: "Need a scoped bet and ready-enough data before proving the engine.",
    will: "Prove the engine: retrieval + generation on a real document, scored for faithfulness and citations." },
  { key: "deploy", n: "04", href: "/deploy", label: "AI Ops", sub: "run",
    question: "Does it run reliably at cost?", raises: "Is it safe to run?",
    reason: "Prove the engine works before running it reliably.",
    will: "The unglamorous 70%: drift, cost-per-query scaling, latency, alerts, a simulated incident." },
  { key: "govern", n: "05", href: "/govern", label: "Govern", sub: "trust",
    question: "Is it safe to run?", raises: "What is it actually worth?",
    reason: "Prove it runs reliably first, then put the controls around it.",
    will: "Risk tiering, policy as code, runtime guardrails, red team evals, and the audit evidence behind every decision." },
  { key: "realize", n: "06", href: "/realize", label: "Realize", sub: "payoff",
    question: "What is it actually worth?", raises: "Scale to the next initiative.",
    reason: "Govern the system first, then count the value it creates.",
    will: "The payoff: a risk adjusted business case where every number traces back to an upstream decision." },
];

export const STAGE_MAP: Record<StageKey, StageDef> = STAGES.reduce(
  (acc, s) => { acc[s.key] = s; return acc; },
  {} as Record<StageKey, StageDef>,
);
