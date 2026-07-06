// Protocol selection engine (GAP-07 · Protocol Selection Lab).
// Six 0..2 answers → weighted scores for function-calling / MCP / A2A / hybrid,
// with the primary recommendation and the runner-up (the flip candidate).

export type PKey = "fc" | "mcp" | "a2a" | "hybrid";

export function evaluate(a: Record<string, number>): { scores: Record<PKey, number>; primary: PKey; runnerUp: PKey } {
  const { q1, q2, q3, q4, q5, q6 } = a;
  const mcp = q1 * 1.6 + q2 * 1.1 + q4 * 1.0 + q5 * 1.1;
  const a2a = q3 * 2.4 + q2 * 0.8;
  const fc = (2 - q1) * 1.7 + (2 - q3) * 1.6 + (q2 === 0 ? 1.5 : 0) + (q6 === 0 ? 1.0 : 0);
  const hybrid = Math.min(mcp, a2a) * 1.15 + q4 * 0.7;
  const scores: Record<PKey, number> = { fc, mcp, a2a, hybrid };
  const ranked = (Object.entries(scores) as [PKey, number][]).sort((x, y) => y[1] - x[1]);
  return { scores, primary: ranked[0][0], runnerUp: ranked[1][0] };
}

// Sensitivity — the judgment layer. For each question, the first alternative answer
// (in option order) that changes the primary recommendation: i.e. the single change
// that would flip the call. Returns one flip per question that has one; an empty
// array means the call is robust (no single answer flips it). `primaryOf` is supplied
// by the caller so the exact scored model the UI shows — including any user weights —
// is the one probed, rather than a second copy that could drift.
export interface SensitivityQuestion {
  key: string;
  q: string;
  opts: string[];
}

export interface Flip<K extends string = PKey> {
  key: string;
  q: string;
  to: string;
  newPrimary: K;
}

export function sensitivity<K extends string = PKey>(
  answers: Record<string, number>,
  questions: SensitivityQuestion[],
  primaryOf: (a: Record<string, number>) => K,
): Flip<K>[] {
  const primary = primaryOf(answers);
  return questions
    .map((qu): Flip<K> | null => {
      const cur = answers[qu.key];
      for (let i = 0; i < qu.opts.length; i++) {
        if (i === cur) continue;
        const alt = primaryOf({ ...answers, [qu.key]: i });
        if (alt !== primary) return { key: qu.key, q: qu.q, to: qu.opts[i], newPrimary: alt };
      }
      return null;
    })
    .filter((s): s is Flip<K> => s !== null);
}

// Integration economics — the N×M vs N+M argument behind protocols. Point-to-point
// integrations grow as producers × consumers (bespoke glue); a shared protocol grows
// as producers + consumers plus a one-off adoption cost. The crossover in consumers is
// where the protocol starts winning — the quantitative case for MCP/A2A over bespoke.
// Pure and framework-agnostic.
export interface IntegrationModel {
  /** cost of one bespoke point-to-point integration. */
  perLink?: number;
  /** cost of exposing/consuming one endpoint on the shared protocol. */
  perEndpoint?: number;
  /** one-off cost of adopting the protocol. */
  protocolFixed?: number;
}

export const bespokeCost = (producers: number, consumers: number, perLink = 1): number =>
  producers * consumers * perLink;

export const protocolCost = (producers: number, consumers: number, model: IntegrationModel = {}): number => {
  const { perEndpoint = 1, protocolFixed = 0 } = model;
  return (producers + consumers) * perEndpoint + protocolFixed;
};

/** The consumer count at which the protocol becomes cheaper than bespoke, for a fixed
 *  producer count. Returns null when adding consumers never makes the protocol win
 *  (denominator ≤ 0) — e.g. a single producer, where bespoke is already minimal. */
export function crossoverConsumers(producers: number, model: IntegrationModel = {}): number | null {
  const { perLink = 1, perEndpoint = 1, protocolFixed = 0 } = model;
  const denom = producers * perLink - perEndpoint;
  if (denom <= 0) return null;
  const consumers = (producers * perEndpoint + protocolFixed) / denom;
  return consumers > 0 ? consumers : null;
}

// Protocol affinity radar — how strongly each protocol's score responds to each decision
// dimension, measured by probing the SAME scorer the UI shows (user weights included).
// For each dimension we raise its answer from low to high (others held at neutral) and
// read the change in each protocol's score: that change is the protocol's responsiveness
// to that dimension. Derived, not hand-authored — the radar moves when weights are edited.
// Negative responsiveness (a protocol favored by the LOW end, e.g. function calling and
// "few tools") is meaningful and preserved here; the radar mapping renders it as inward.
export interface ProtocolAxis {
  key: string;
  label: string;
}

const PKEYS: readonly PKey[] = ["fc", "mcp", "a2a", "hybrid"];

export function protocolAffinity(
  scoreOf: (a: Record<string, number>) => Record<PKey, number>,
  axes: ProtocolAxis[],
  keys: readonly PKey[] = PKEYS,
  lo = 0,
  hi = 2,
  neutral = 1,
): Record<PKey, Record<string, number>> {
  const base: Record<string, number> = {};
  for (const ax of axes) base[ax.key] = neutral;
  const out = {} as Record<PKey, Record<string, number>>;
  for (const k of keys) out[k] = {};
  for (const ax of axes) {
    const hiS = scoreOf({ ...base, [ax.key]: hi });
    const loS = scoreOf({ ...base, [ax.key]: lo });
    for (const k of keys) out[k][ax.key] = hiS[k] - loS[k];
  }
  return out;
}

/** Map the affinity matrix onto a bipolar 0..100 radar scale: 50 is neutral (this
 *  dimension neither favors nor opposes the protocol), 100 is maximal favor, 0 is
 *  maximal opposition. One global |max| across all protocol×axis cells sets the span so
 *  the four shapes are comparable and mirror-image opposites (function-calling vs MCP on
 *  tool breadth) read as such. Values are returned in `axes` order per protocol. */
export function affinityRadar(
  affinity: Record<PKey, Record<string, number>>,
  axes: ProtocolAxis[],
  keys: readonly PKey[] = PKEYS,
): Record<PKey, number[]> {
  let max = 0;
  for (const k of keys) for (const ax of axes) max = Math.max(max, Math.abs(affinity[k][ax.key]));
  const span = max > 0 ? 50 / max : 0;
  const out = {} as Record<PKey, number[]>;
  for (const k of keys) {
    out[k] = axes.map((ax) => {
      const v = 50 + affinity[k][ax.key] * span;
      return v < 0 ? 0 : v > 100 ? 100 : v;
    });
  }
  return out;
}

// Why not the others — for the recommended protocol, the single decision dimension that
// most separates it from each rival GIVEN THE USER'S ANSWERS. A dimension's contribution
// to a protocol ≈ its per-unit responsiveness × the user's answer on that dimension; the
// rival lost most on the dimension with the largest (primary − rival) contribution gap.
// That names the call in the user's own inputs ("A2A only pays off when agents coordinate
// — you have one agent"). Deterministic; ties break toward the earlier axis.
export interface WhyNot {
  protocol: PKey;
  axisKey: string;
  axisLabel: string;
  gap: number;
}

export function whyNotOthers(
  affinity: Record<PKey, Record<string, number>>,
  answers: Record<string, number>,
  axes: ProtocolAxis[],
  primary: PKey,
  keys: readonly PKey[] = PKEYS,
  hi = 2,
): WhyNot[] {
  const contrib = (k: PKey, axKey: string) => affinity[k][axKey] * ((answers[axKey] ?? 0) / hi);
  return keys
    .filter((k) => k !== primary)
    .map((k) => {
      let best = axes[0];
      let bestGap = -Infinity;
      for (const ax of axes) {
        const gap = contrib(primary, ax.key) - contrib(k, ax.key);
        if (gap > bestGap) {
          bestGap = gap;
          best = ax;
        }
      }
      return { protocol: k, axisKey: best.key, axisLabel: best.label, gap: bestGap };
    });
}

// Recommendation card — normalize the scores into a compact, shareable model: the four
// protocols as fit bars (sorted, percent of the leader), the runner-up, the margin, and a
// confidence read from how far the leader sits above the runner-up. Pure — the component
// renders it as an SVG card and exports a PNG; keeping the model here means the exported
// artifact and the on-screen scores come from one computation.
export interface ProtoBar {
  key: PKey;
  label: string;
  pct: number;      // score as a percent of the leader (0..100)
  primary: boolean;
}
export interface ProtoCard {
  primary: PKey;
  primaryLabel: string;
  runnerUp: PKey;
  runnerUpLabel: string;
  margin: number;   // primaryScore - runnerUpScore
  confidence: "clear" | "close" | "toss-up";
  bars: ProtoBar[];
}
export function recommendationCard(
  scores: Record<PKey, number>,
  primary: PKey,
  runnerUp: PKey,
  labelOf: (k: PKey) => string,
  keys: readonly PKey[] = PKEYS,
): ProtoCard {
  const max = Math.max(...keys.map((k) => scores[k])) || 1;
  const bars = [...keys]
    .sort((a, b) => scores[b] - scores[a])
    .map((k) => ({ key: k, label: labelOf(k), pct: Math.round((scores[k] / max) * 100), primary: k === primary }));
  const margin = scores[primary] - scores[runnerUp];
  const ratio = margin / max;
  const confidence: ProtoCard["confidence"] = ratio >= 0.25 ? "clear" : ratio >= 0.1 ? "close" : "toss-up";
  return { primary, primaryLabel: labelOf(primary), runnerUp, runnerUpLabel: labelOf(runnerUp), margin, confidence, bars };
}

// Explain the call — compose the already-computed pieces (the card, the why-not contrasts,
// and the sensitivity flips) into an ordered, plain-English rationale a reader can follow
// without the charts: the verdict and its confidence, the decision dimensions that point to
// the primary, the closest alternative, and whether any single answer flips it. Pure — it
// only formats tested outputs, so the transcript can't disagree with the scores.
export interface ExplanationLine {
  kind: "verdict" | "driver" | "runner-up" | "flip" | "robust";
  text: string;
}
export function explainRecommendation(
  card: ProtoCard,
  whyNot: WhyNot[],
  flips: Flip[],
  labelOf: (k: PKey) => string,
): ExplanationLine[] {
  const lines: ExplanationLine[] = [];
  lines.push({ kind: "verdict", text: `${card.primaryLabel} — a ${card.confidence} call, +${card.margin.toFixed(1)} ahead of ${card.runnerUpLabel}.` });
  const driverAxes: string[] = [];
  for (const w of whyNot) if (!driverAxes.includes(w.axisLabel)) driverAxes.push(w.axisLabel);
  for (const ax of driverAxes.slice(0, 3)) lines.push({ kind: "driver", text: `Your "${ax}" answer points to ${card.primaryLabel}.` });
  lines.push({ kind: "runner-up", text: `Closest alternative: ${card.runnerUpLabel}.` });
  if (flips.length === 0) {
    lines.push({ kind: "robust", text: "No single answer change flips the call — the recommendation is robust." });
  } else {
    const f = flips[0];
    lines.push({ kind: "flip", text: `It would flip to ${labelOf(f.newPrimary)} if "${f.q}" became "${f.to}".` });
  }
  return lines;
}
