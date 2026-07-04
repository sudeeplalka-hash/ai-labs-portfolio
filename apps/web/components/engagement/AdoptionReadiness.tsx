"use client";

// EL-01 · Adoption & Change Readiness Instrument (Collection 4 · control room · flagship).
// The model was never the risk — the people who have to trust it were. Six weighted
// readiness factors → composite → gate verdict (SCALE / SCALE WITH CONDITIONS / HOLD)
// → a two-week adoption plan that rewrites as the weakest factors move. SIMULATED;
// weighted composite with visible weights and a defended threshold.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, type BadgeTone } from "@labs/design-system";

type FactorKey = "sponsorship" | "workflow" | "trust" | "training" | "incentives" | "comms";
type Factors = Record<FactorKey, number>;

const FACTORS: { key: FactorKey; label: string; weight: number; hint: string }[] = [
  { key: "sponsorship", label: "Sponsorship strength", weight: 0.25, hint: "Is a visible leader actively backing this?" },
  { key: "trust", label: "Trust in output", weight: 0.20, hint: "Do users believe the assist, and can they override?" },
  { key: "workflow", label: "Workflow fit", weight: 0.15, hint: "Does it live in the tool they already use?" },
  { key: "training", label: "Training coverage", weight: 0.15, hint: "Role-based, or one all-hands and hope?" },
  { key: "comms", label: "Comms quality", weight: 0.15, hint: "Two-way and fast, or broadcast-only?" },
  { key: "incentives", label: "Incentive alignment", weight: 0.10, hint: "Does the scorecard reward using it?" },
];

const ACTION: Record<FactorKey, string> = {
  sponsorship: "Lock a visible executive sponsor and a leader-led kickoff; a 5-minute sponsor message every week.",
  trust: "Publish an accuracy scorecard and a one-click override; run a 'show your work' session with the loudest skeptics.",
  workflow: "Redesign the two highest-friction steps and embed the assist in the existing tool — no new tab.",
  training: "Role-based training waves, not an all-hands; certify floor champions first.",
  comms: "Switch from broadcast to two-way: weekly office hours, a visible changelog, fixes shipped within days.",
  incentives: "Fix the scorecard — reward assisted-handle quality, not raw handle time; drop the metric that punishes usage.",
};

const SCENARIOS: { key: string; label: string; people: number; defaults: Factors }[] = [
  { key: "servicing", label: "AI assist · 900 servicing agents", people: 900, defaults: { sponsorship: 78, trust: 52, workflow: 64, training: 60, comms: 66, incentives: 45 } },
  { key: "noc", label: "Network-ops copilot · 300 NOC engineers", people: 300, defaults: { sponsorship: 70, trust: 48, workflow: 58, training: 55, comms: 60, incentives: 50 } },
];

const composite = (f: Factors) => Math.round(FACTORS.reduce((a, x) => a + x.weight * f[x.key], 0));
type Gate = { verdict: string; tone: BadgeTone };
const gateFor = (c: number): Gate => (c >= 75 ? { verdict: "Scale", tone: "emerald" } : c >= 60 ? { verdict: "Scale with conditions", tone: "amber" } : { verdict: "Hold", tone: "rose" });

export function AdoptionReadiness() {
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey)!;
  const [factors, setFactors] = useState<Factors>(scenario.defaults);

  const onScenario = (k: string) => {
    setScenarioKey(k);
    setFactors(SCENARIOS.find((s) => s.key === k)!.defaults);
  };
  const setF = (key: FactorKey, v: number) => setFactors((f) => ({ ...f, [key]: v }));

  const c = composite(factors);
  const gate = gateFor(c);
  const weak = FACTORS.filter((x) => factors[x.key] < 70).sort((a, b) => factors[a.key] - factors[b.key]);
  const priorities = weak.slice(0, 3);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-01</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Engagement Leadership · Control room</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Adoption &amp; Change Readiness</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            A pilot that works technically still dies if the people don&apos;t adopt it. Score the six factors that
            decide adoption and the gate tells you whether to scale — and the plan tells you what to fix first.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button key={s.key} onClick={() => onScenario(s.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${s.key === scenarioKey ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>{s.label}</button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sliders */}
          <Panel className="space-y-4">
            <p className="stat-label">Readiness factors <span className="font-normal text-slatey-500">· weight shown</span></p>
            {FACTORS.map((x) => (
              <div key={x.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slatey-400">{x.label} <span className="text-slatey-500">· {Math.round(x.weight * 100)}%</span></label>
                  <span className={`font-mono text-xs font-semibold ${factors[x.key] < 55 ? "text-rose-600" : factors[x.key] < 70 ? "text-amber-600" : "text-emerald-700"}`}>{factors[x.key]}</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={factors[x.key]} onChange={(e) => setF(x.key, Number(e.target.value))} className="w-full accent-primary" />
                <p className="mt-0.5 text-[11px] text-slatey-500">{x.hint}</p>
              </div>
            ))}
          </Panel>

          {/* Verdict + plan */}
          <div className="space-y-4">
            <Panel>
              <div className="flex items-end justify-between">
                <div>
                  <p className="stat-label">Composite readiness</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-ink">{c}<span className="text-lg text-slatey-500">/100</span></p>
                </div>
                <Badge tone={gate.tone}>{gate.verdict}</Badge>
              </div>
              <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="absolute inset-y-0 left-0 bg-rose-200" style={{ width: "60%" }} />
                <div className="absolute inset-y-0 bg-amber-200" style={{ left: "60%", width: "15%" }} />
                <div className="absolute inset-y-0 right-0 bg-emerald-200" style={{ left: "75%" }} />
                <div className="absolute -top-0.5 h-4 w-[3px] rounded bg-ink" style={{ left: `calc(${c}% - 1px)` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slatey-500"><span>Hold</span><span>60</span><span>75</span><span>Scale</span></div>
              <p className="mt-3 text-xs italic text-slatey-500">I gate below 60 because I&apos;ve watched pilots that scaled anyway die at week six — the trust wasn&apos;t there and the floor knew it.</p>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Two-week adoption plan</p>
              {priorities.length === 0 ? (
                <p className="text-sm text-slatey-400">All factors are healthy — proceed to scale with the standard champion model and a weekly pulse.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {priorities.map((x) => (
                    <li key={x.key} className="rounded-md border border-line bg-white p-2.5">
                      <div className="mb-0.5 flex items-center gap-2"><Badge tone="rose">Fix</Badge><span className="font-medium text-ink">{x.label}</span><span className="text-[11px] text-slatey-500">at {factors[x.key]}</span></div>
                      <p className="text-slatey-300">{ACTION[x.key]}</p>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-slatey-400"><span className="font-semibold text-ink">Always on:</span> one floor champion per ~{Math.max(10, Math.round(scenario.people / 60))} users, a two-week feedback loop, and a visible fix log so users see their input ship.</p>
            </Panel>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title={gate.verdict === "Hold" ? "Not ready — and scaling anyway is the expensive mistake" : gate.verdict === "Scale with conditions" ? "Conditional go — fix the flagged factors in parallel with the ramp" : "Ready to scale"} tone={gate.tone === "rose" ? "danger" : gate.tone === "amber" ? "warn" : "success"}>
            The composite is dragged most by <span className="font-semibold">{(weak[0]?.label ?? "nothing").toLowerCase()}</span>. Adoption is a trust problem wearing a training problem&apos;s clothes — spend the two weeks there, not on another demo.
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> The model was never the risk. The {scenario.people} people who have to trust it were.</p>
          <p className="text-xs italic text-slatey-500">Resume echo — Gen AI rollouts at AMEX; the adoption half of the 4.5× scale story.</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Composite = weighted sum of six factors (sponsorship 25% · trust 20% · workflow 15% · training 15% · comms 15% · incentives 10%). Gate: ≥75 scale · 60–74 conditions · &lt;60 hold.</p>
              <p>The plan is generated from the weakest factors (below 70), each mapped to a concrete first move; the champion ratio scales with the population.</p>
              <p>Stack: Next.js (static) + shared design system; client-side only.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> weights are defensible defaults, not calibrated against outcome data; scoring is judgment-based. The instrument structures the readiness conversation — it doesn&apos;t replace it.</p>
        </div>
      </main>
    </div>
  );
}
