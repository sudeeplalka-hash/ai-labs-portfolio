// ============================================================================
// The Story Spine, the single source of truth for the *narrative* layer.
//
// Each lab is one beat in a six-part story: a question it answers, the decision
// made there, what it inherits and what it hands on, and the live headline(s)
// read straight from ProgramState. The Storyline overview, the per-page
// "in ← / out →" thread, and the board one-pager all render from THIS, so the
// exec narrative and the technical deep-dive can never drift apart.
//
// This module is pure: it only *reads* state. No React, no side effects.
// ============================================================================

import type { ProgramState, StageKey } from "./types";
import { STAGE_MAP } from "./stages";
import { deriveOpsSeries, detectSignals, valueAtRisk } from "./operate-day2";

export type StoryTone = "healthy" | "watch" | "risk" | "neutral";

/** One headline chip for a beat, a value, what it is, and a health tone. */
export interface StoryHeadline {
  label: string;
  value: string;
  tone: StoryTone;
}

export interface StoryBeat {
  key: StageKey;
  n: string; // "01".."06"
  href: string; // "/frame" ...
  label: string; // "Strategy & Framing" ...
  /** The one question this beat answers, story-framed. */
  question: string;
  /** The decision the visitor makes here, one line. */
  decision: string;
  /** What this beat inherits from upstream (human phrase). */
  inFrom: string;
  /** What this beat hands to downstream (human phrase). */
  outTo: string;
  /** Live headline chips (1 to 3), read from state; empty-ish when not run. */
  read: (s: ProgramState) => StoryHeadline[];
  /** Has this beat produced real output yet? */
  isDone: (s: ProgramState) => boolean;
  /** One plain-language sentence telling this beat of the story. */
  soWhat: (s: ProgramState) => string;
}

// ---- small, dependency-free formatters --------------------------------------

const DASH = "N/A";
const num = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);

function usd(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}k`;
  return `${sign}$${Math.round(a)}`;
}

function scoreTone(v: number | null, good = 70, ok = 50): StoryTone {
  if (v === null) return "neutral";
  return v >= good ? "healthy" : v >= ok ? "watch" : "risk";
}

function tierTone(tier?: string): StoryTone {
  const t = (tier ?? "").toLowerCase();
  if (t === "low") return "healthy";
  if (t === "medium") return "watch";
  if (t === "high" || t === "critical") return "risk";
  return "neutral";
}

// ---- the spine --------------------------------------------------------------

function beat(
  key: StageKey,
  question: string,
  decision: string,
  inFrom: string,
  outTo: string,
  read: StoryBeat["read"],
  isDone: StoryBeat["isDone"],
  soWhat: StoryBeat["soWhat"],
): StoryBeat {
  const def = STAGE_MAP[key];
  return { key, n: def.n, href: def.href, label: def.label, question, decision, inFrom, outTo, read, isDone, soWhat };
}

export const STORY_SPINE: StoryBeat[] = [
  beat(
    "frame",
    "What should we build, and is it worth a bet?",
    "Sharpen a fuzzy ambition into one scoped, scored bet.",
    "a rough ambition",
    "the framed bet → Data",
    (s) => {
      const sc = s.initiative?.scores;
      return [
        { label: "Value", value: num(sc?.value) !== null ? `${sc!.value}` : DASH, tone: scoreTone(num(sc?.value)) },
        { label: "Feasibility", value: num(sc?.feasibility) !== null ? `${sc!.feasibility}` : DASH, tone: scoreTone(num(sc?.feasibility)) },
        { label: "Data ready", value: num(sc?.dataReadiness) !== null ? `${sc!.dataReadiness}` : DASH, tone: scoreTone(num(sc?.dataReadiness)) },
      ];
    },
    (s) => !!s.initiative?.name,
    (s) => {
      const i = s.initiative;
      if (!i?.name) return "No bet framed yet, start by sharpening the ambition.";
      const v = num(i.scores?.value);
      return `The bet: "${i.name}"${v !== null ? `, value ${v}/100, scoped and scored.` : "."}`;
    },
  ),

  beat(
    "data",
    "Is the data ready to fuel it?",
    "Profile sources, clear sensitive data, set the ingestion gate.",
    "the framed bet",
    "a readiness score → Build",
    (s) => {
      const r = num(s.data?.readinessScore);
      const g = num(s.data?.gaps);
      const out: StoryHeadline[] = [{ label: "Readiness", value: r !== null ? `${r}/100` : DASH, tone: scoreTone(r) }];
      if (g !== null) out.push({ label: "Open gaps", value: `${g}`, tone: g === 0 ? "healthy" : g <= 2 ? "watch" : "risk" });
      return out;
    },
    (s) => num(s.data?.readinessScore) !== null,
    (s) => {
      const r = num(s.data?.readinessScore);
      if (r === null) return "Data not assessed yet, the framing readiness guess is still unproven.";
      return `The corpus scores ${r}/100${s.data?.status ? ` (${s.data.status})` : ""} against your ingestion guidelines.`;
    },
  ),

  beat(
    "build",
    "Which engine, and does it actually work?",
    "Choose the LLM, then tune retrieval and score the answers.",
    "a ready-enough corpus",
    "engine + answer quality → Deploy",
    (s) => {
      const f = num(s.rag?.faithfulness);
      const out: StoryHeadline[] = [];
      if (s.rag?.model) out.push({ label: "Engine", value: s.rag.model, tone: "neutral" });
      out.push({ label: "Faithfulness", value: f !== null ? `${f}` : DASH, tone: scoreTone(f, 85, 70) });
      return out;
    },
    (s) => num(s.rag?.faithfulness) !== null || !!s.rag?.model,
    (s) => {
      const f = num(s.rag?.faithfulness);
      const eng = s.rag?.model ? `on ${s.rag.model}` : "on an unspecified engine";
      if (f === null) return `Engine ${eng}; answer quality not yet measured.`;
      return `Running ${eng}, answers score ${f}/100 on faithfulness.`;
    },
  ),

  beat(
    "deploy",
    "Will it run reliably, within budget?",
    "Find the cost/latency envelope at real load.",
    "the engine + its answer quality",
    "run cost → Realize · posture → Govern",
    (s) => {
      const c = num(s.deploy?.monthlyCostAtTarget);
      const p = num(s.deploy?.latencyP95);
      const rel = num(s.deploy?.reliability);
      const out: StoryHeadline[] = [];
      out.push({ label: "Monthly cost", value: c !== null ? `${usd(c)}` : DASH, tone: "neutral" });
      if (p !== null) out.push({ label: "p95", value: `${(p / 1000).toFixed(2)}s`, tone: p <= 2000 ? "healthy" : "watch" });
      if (rel !== null) out.push({ label: "Reliability", value: `${(rel * 100).toFixed(1)}%`, tone: rel >= 0.99 ? "healthy" : rel >= 0.97 ? "watch" : "risk" });
      return out;
    },
    (s) => num(s.deploy?.monthlyCostAtTarget) !== null,
    (s) => {
      const c = num(s.deploy?.monthlyCostAtTarget);
      if (c === null) return "Operating envelope not yet run, cost and latency at scale are unproven.";
      const p = num(s.deploy?.latencyP95);
      return `Runs at ${usd(c)}/month${p !== null ? `, p95 ${(p / 1000).toFixed(2)}s` : ""} at target load.`;
    },
  ),

  beat(
    "govern",
    "Is it safe enough to trust?",
    "Tier the risk and put the controls around it.",
    "the use case + data sensitivity",
    "a risk discount → Realize",
    (s) => {
      const out: StoryHeadline[] = [];
      out.push({ label: "Risk tier", value: s.governance?.riskTier ?? DASH, tone: tierTone(s.governance?.riskTier) });
      const ct = num(s.governance?.controls);
      if (ct !== null) out.push({ label: "Controls", value: `${ct}`, tone: ct > 0 ? "healthy" : "watch" });
      return out;
    },
    (s) => !!s.governance?.riskTier,
    (s) => {
      if (!s.governance?.riskTier) return "Risk not yet assessed, controls and guardrails are undefined.";
      const ct = num(s.governance?.controls);
      return `Classified ${s.governance.riskTier} risk${ct !== null ? `, with ${ct} controls mapped.` : "."}`;
    },
  ),

  beat(
    "realize",
    "What is it actually worth?",
    "Assemble the risk adjusted business case.",
    "every upstream decision",
    "the defended business case",
    (s) => {
      const rav = num(s.outcomes?.riskAdjustedValue);
      const roi = num(s.outcomes?.roi);
      const pay = num(s.outcomes?.paybackMonths);
      const out: StoryHeadline[] = [];
      out.push({ label: "Risk adj. value", value: rav !== null ? `${usd(rav)}/yr` : DASH, tone: rav !== null ? (rav > 0 ? "healthy" : "risk") : "neutral" });
      if (roi !== null) out.push({ label: "ROI", value: `${Math.round(roi)}%`, tone: roi > 50 ? "healthy" : roi > 0 ? "watch" : "risk" });
      if (pay !== null && isFinite(pay)) out.push({ label: "Payback", value: `${pay}mo`, tone: pay <= 12 ? "healthy" : pay <= 24 ? "watch" : "risk" });
      return out;
    },
    (s) => num(s.outcomes?.roi) !== null,
    (s) => {
      const roi = num(s.outcomes?.roi);
      const rav = num(s.outcomes?.riskAdjustedValue);
      if (roi === null) return "Business case not yet assembled, the payoff is still a hypothesis.";
      return `The defensible case: ${rav !== null ? `${usd(rav)}/yr` : "value"} at ${Math.round(roi)}% ROI, every number traceable upstream.`;
    },
  ),

  beat(
    "operate",
    "Is it still working, and what do we do when it isn't?",
    "Read the signals, then retrain / reindex / rollback / rescope, and loop it back.",
    "the live system + its defended business case",
    "the next Frame, the loop closes",
    (s) => {
      if (!s.initiative?.name) return [{ label: "Signals", value: DASH, tone: "neutral" }];
      const series = deriveOpsSeries(s);
      const signals = detectSignals(series, s.initiative?.meta?.governanceTier);
      const vaR = valueAtRisk(s, series);
      return [
        { label: "Open signals", value: `${signals.length}`, tone: signals.length === 0 ? "healthy" : signals.some((x) => x.severity === "high") ? "risk" : "watch" },
        { label: "Value at risk", value: vaR.valueAtRiskUsd > 0 ? `${usd(vaR.valueAtRiskUsd)}/yr` : DASH, tone: vaR.valueAtRiskUsd > 0 ? "risk" : "healthy" },
      ];
    },
    (s) => !!s.iteration?.recommendedNextAction,
    (s) => {
      if (!s.initiative?.name) return "Nothing in production yet, Operate begins the day you deploy.";
      const series = deriveOpsSeries(s);
      const signals = detectSignals(series, s.initiative?.meta?.governanceTier);
      if (!signals.length) return "In production and steady, SLOs green and canary evals holding.";
      const vaR = valueAtRisk(s, series);
      return `${signals.length} open signal${signals.length === 1 ? "" : "s"}: SLOs read green while the answers decay, ${usd(vaR.valueAtRiskUsd)}/yr at risk. The remediation call loops back to the next Frame.`;
    },
  ),
];

export const STORY_MAP: Record<StageKey, StoryBeat> = STORY_SPINE.reduce(
  (acc, b) => { acc[b.key] = b; return acc; },
  {} as Record<StageKey, StoryBeat>,
);

/** Beats either side of a stage, for the in ← / out → thread. */
export function storyNeighbors(key: StageKey): { prev: StoryBeat | null; next: StoryBeat | null } {
  const idx = STORY_SPINE.findIndex((b) => b.key === key);
  return {
    prev: idx > 0 ? STORY_SPINE[idx - 1] : null,
    next: idx >= 0 && idx < STORY_SPINE.length - 1 ? STORY_SPINE[idx + 1] : null,
  };
}

/** How far the story has been told, for an overview progress read. */
export function storyProgress(s: ProgramState): { done: number; total: number } {
  return { done: STORY_SPINE.filter((b) => b.isDone(s)).length, total: STORY_SPINE.length };
}
