import { describe, it, expect } from "vitest";
import { agentTimeline, messageFrames, baselineVsMulti } from "./orchestration";

describe("agentTimeline", () => {
  it("lays the steps out in order between Decompose and Assemble", () => {
    const t = agentTimeline(["A", "B", "C"], 10);
    expect(t.map((s) => s.label)).toEqual(["Decompose", "A", "B", "C", "Assemble"]);
  });

  it("produces contiguous spans starting at 0", () => {
    const t = agentTimeline(["A", "B"], 10);
    expect(t[0].startS).toBe(0);
    for (let i = 1; i < t.length; i++) expect(t[i].startS).toBeCloseTo(t[i - 1].endS, 6);
  });

  it("sums to the authored total latency", () => {
    const t = agentTimeline(["A", "B", "C", "D"], 9.6);
    expect(t[t.length - 1].endS).toBeCloseTo(9.6, 6);
    expect(t.reduce((a, s) => a + s.durationS, 0)).toBeCloseTo(9.6, 6);
  });

  it("splits the supervisor fraction evenly across decompose and assemble", () => {
    const t = agentTimeline(["A", "B"], 10, { supervisorFraction: 0.2 });
    const decompose = t[0].durationS;
    const assemble = t[t.length - 1].durationS;
    expect(decompose + assemble).toBeCloseTo(2, 6); // 20% of 10
    expect(decompose).toBeCloseTo(assemble, 6);
  });

  it("splits the remaining work evenly across the steps", () => {
    const t = agentTimeline(["A", "B"], 10, { supervisorFraction: 0.2 }); // work 8 → 4 each
    expect(t[1].durationS).toBeCloseTo(4, 6);
    expect(t[2].durationS).toBeCloseTo(4, 6);
  });

  it("handles zero steps (decompose + assemble only)", () => {
    const t = agentTimeline([], 10);
    expect(t.map((s) => s.label)).toEqual(["Decompose", "Assemble"]);
    expect(t[t.length - 1].endS).toBeCloseTo(10, 6);
  });
});

describe("messageFrames", () => {
  const agents = [
    { role: "Researcher", task: "Gather intel.", output: "Found A, B, C." },
    { role: "Analyst", task: "Find the gaps.", output: "Gap: no audit trail." },
  ];
  const messages = [
    { from: "Supervisor", to: "Researcher", label: "assign · gather intel" },
    { from: "Researcher", to: "Analyst", label: "handoff · findings" },
    { from: "Analyst", to: "Supervisor", label: "return · done" },
  ];

  it("emits one sequenced frame per message", () => {
    const f = messageFrames(messages, agents, "goal");
    expect(f).toHaveLength(3);
    expect(f.map((x) => x.seq)).toEqual([1, 2, 3]);
  });

  it("maps the verb to a JSON-RPC-ish method (known + fallback slug)", () => {
    const f = messageFrames(messages, agents, "goal");
    expect(f[0].method).toBe("tasks/assign");
    expect(f[1].method).toBe("tasks/handoff");
    const odd = messageFrames([{ from: "A", to: "B", label: "escalate now · urgent" }], agents, "g");
    expect(odd[0].method).toBe("tasks/escalate-now");
  });

  it("directions: assign is a request, handoff/return are responses", () => {
    const f = messageFrames(messages, agents, "goal");
    expect(f[0].kind).toBe("request");
    expect(f[1].kind).toBe("response");
    expect(f[2].kind).toBe("response");
  });

  it("a request carries the recipient's task; a response carries the sender's output", () => {
    const f = messageFrames(messages, agents, "goal");
    expect(f[0].params.instruction).toBe("Gather intel."); // to = Researcher
    expect(f[1].params.artifact).toBe("Found A, B, C.");    // from = Researcher
    expect(f[0].params.goal).toBe("goal");
    expect(f[0].params.summary).toBe("gather intel");
  });

  it("is deterministic", () => {
    expect(messageFrames(messages, agents, "g")).toEqual(messageFrames(messages, agents, "g"));
  });
});

describe("baselineVsMulti", () => {
  const single = { quality: 60, costUsd: 0.02, latencyS: 4 };
  const multi = { quality: 81, costUsd: 0.05, latencyS: 10 };

  it("computes per-metric percent deltas", () => {
    const h = baselineVsMulti(single, multi);
    const q = h.metrics.find((m) => m.key === "quality")!;
    expect(q.deltaPct).toBeCloseTo(35, 6); // (81-60)/60
  });

  it("decides who wins each metric by its direction", () => {
    const h = baselineVsMulti(single, multi);
    expect(h.metrics.find((m) => m.key === "quality")!.multiWins).toBe(true);  // higher quality
    expect(h.metrics.find((m) => m.key === "cost")!.multiWins).toBe(false);    // costs more
    expect(h.metrics.find((m) => m.key === "latency")!.multiWins).toBe(false); // slower
  });

  it("reports cost and latency as multiples of the baseline", () => {
    const h = baselineVsMulti(single, multi);
    expect(h.costMultiple).toBeCloseTo(2.5, 6);
    expect(h.latencyMultiple).toBeCloseTo(2.5, 6);
  });

  it("summarizes the tradeoff in one verdict line", () => {
    expect(baselineVsMulti(single, multi).verdict).toMatch(/% quality for .*cost and .*latency/);
  });

  it("guards a zero baseline (no divide-by-zero)", () => {
    const h = baselineVsMulti({ quality: 0, costUsd: 0, latencyS: 0 }, multi);
    expect(h.costMultiple).toBe(0);
    expect(h.metrics.every((m) => Number.isFinite(m.deltaPct))).toBe(true);
  });
});
