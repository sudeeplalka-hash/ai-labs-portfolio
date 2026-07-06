// Orchestration timeline (GAP-03). The A2A messages define a sequential handoff
// chain (supervisor → agents in order → supervisor), which is *why* multiagent
// latency exceeds a single agent. This lays that chain out on a time axis: a
// Decompose span, the agents in series, then an Assemble span, summing to the
// authored total latency. The ordering and the sum-to-total are the real teaching
// point; the even per-agent split is illustrative (authored runs carry no per-agent
// stopwatch). Pure and framework-agnostic.
export interface TimelineSpan {
  label: string;
  startS: number;
  durationS: number;
  endS: number;
}
export interface TimelineOptions {
  /** combined share of latency for the supervisor's decompose + assemble (split evenly). */
  supervisorFraction?: number;
}

export function agentTimeline(steps: string[], totalLatencyS: number, opts: TimelineOptions = {}): TimelineSpan[] {
  const superFraction = opts.supervisorFraction ?? 0.2;
  // With no agent steps the supervisor phases absorb the whole latency, so the
  // timeline always sums to the authored total.
  const superEach = steps.length > 0 ? (totalLatencyS * superFraction) / 2 : totalLatencyS / 2;
  const workTotal = Math.max(0, totalLatencyS - superEach * 2);
  const each = steps.length > 0 ? workTotal / steps.length : 0;
  const spans: TimelineSpan[] = [];
  let t = 0;
  const push = (label: string, dur: number) => { spans.push({ label, startS: t, durationS: dur, endS: t + dur }); t += dur; };
  push("Decompose", superEach);
  for (const s of steps) push(s, each);
  push("Assemble", superEach);
  return spans;
}

// A2A message inspector, expands each coordination hop into the structured envelope an
// agent-to-agent protocol would actually carry: a JSON-RPC-ish method, the request/response
// direction, and the payload (the recipient's assignment on a request, the sender's output
// on a response). Derived deterministically from the authored run, the point is to make the
// "· label" on each arrow legible as a real contract, not to fake wire bytes. Pure.
export type A2AKind = "request" | "response";
export interface A2AFrame {
  seq: number;
  method: string;
  kind: A2AKind;
  from: string;
  to: string;
  summary: string;
  params: Record<string, string>;
}
export interface FrameMsg { from: string; to: string; label: string; }
export interface FrameAgent { role: string; task: string; output: string; }

const A2A_METHOD: Record<string, string> = {
  assign: "tasks/assign",
  handoff: "tasks/handoff",
  "review request": "tasks/review",
  return: "tasks/return",
};

export function messageFrames(messages: FrameMsg[], agents: FrameAgent[], goal: string): A2AFrame[] {
  const agentOf = (role: string) => agents.find((a) => a.role === role);
  return messages.map((m, i) => {
    const parts = m.label.split("·").map((s) => s.trim());
    const verb = (parts[0] ?? "").toLowerCase();
    const summary = parts[1] ?? "";
    const method = A2A_METHOD[verb] ?? `tasks/${verb.replace(/\s+/g, "-")}`;
    const kind: A2AKind = verb === "handoff" || verb === "return" ? "response" : "request";
    const params: Record<string, string> = { goal };
    if (summary) params.summary = summary;
    const toAgent = agentOf(m.to);
    const fromAgent = agentOf(m.from);
    if (toAgent) params.instruction = toAgent.task;    // a request tells the recipient its task
    if (fromAgent) params.artifact = fromAgent.output; // a handoff/return carries the sender's output
    return { seq: i + 1, method, kind, from: m.from, to: m.to, summary, params };
  });
}

// Single-agent baseline vs multiagent, the head-to-head that makes the thesis honest:
// multiagent buys quality by spending cost and latency. Computes the per-metric deltas
// (percent change and who wins, given each metric's direction) plus the cost/latency
// multiples and a one-line tradeoff verdict. Pure; operates on the same authored figures
// the meter shows.
export interface RunMetrics { quality: number; costUsd: number; latencyS: number; }
export interface MetricDelta {
  key: "quality" | "cost" | "latency";
  label: string;
  single: number;
  multi: number;
  deltaPct: number;    // (multi - single) / single × 100
  betterIsUp: boolean; // quality: higher is better; cost/latency: lower is better
  multiWins: boolean;  // did multiagent improve this metric?
}
export interface HeadToHead {
  metrics: MetricDelta[];
  qualityGainPct: number;
  costMultiple: number;
  latencyMultiple: number;
  verdict: string;
}
export function baselineVsMulti(single: RunMetrics, multi: RunMetrics): HeadToHead {
  const pct = (a: number, b: number) => (a === 0 ? 0 : ((b - a) / a) * 100);
  const metrics: MetricDelta[] = [
    { key: "quality", label: "Quality", single: single.quality, multi: multi.quality, deltaPct: pct(single.quality, multi.quality), betterIsUp: true, multiWins: multi.quality > single.quality },
    { key: "cost", label: "Cost / run", single: single.costUsd, multi: multi.costUsd, deltaPct: pct(single.costUsd, multi.costUsd), betterIsUp: false, multiWins: multi.costUsd < single.costUsd },
    { key: "latency", label: "Latency", single: single.latencyS, multi: multi.latencyS, deltaPct: pct(single.latencyS, multi.latencyS), betterIsUp: false, multiWins: multi.latencyS < single.latencyS },
  ];
  const qualityGainPct = pct(single.quality, multi.quality);
  const costMultiple = single.costUsd === 0 ? 0 : multi.costUsd / single.costUsd;
  const latencyMultiple = single.latencyS === 0 ? 0 : multi.latencyS / single.latencyS;
  const verdict = `+${Math.round(qualityGainPct)}% quality for ${costMultiple.toFixed(1)}× cost and ${latencyMultiple.toFixed(1)}× latency`;
  return { metrics, qualityGainPct, costMultiple, latencyMultiple, verdict };
}
