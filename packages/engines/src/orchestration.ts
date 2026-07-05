// Orchestration timeline (GAP-03). The A2A messages define a sequential handoff
// chain (supervisor → agents in order → supervisor), which is *why* multi-agent
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
