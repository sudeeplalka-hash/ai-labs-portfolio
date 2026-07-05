"use client";

// EL-01 · Adoption & Change Readiness Instrument (Collection 4 · control room · flagship).
// The model was never the risk — the people who have to trust it were. Six weighted
// readiness factors → composite → gate verdict (SCALE / SCALE WITH CONDITIONS / HOLD)
// → a two-week adoption plan that rewrites as the weakest factors move. SIMULATED;
// weighted composite with visible weights and a defended threshold.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Share2, RotateCcw, Download } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard, LabToolbar, ToolbarButton, Drawer, toast, ToastHost, type BadgeTone } from "@labs/design-system";
import { EL01_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";
import { downloadMarkdown } from "../artifact/artifact";

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

const FACTOR_KEYS = FACTORS.map((x) => x.key);

// Editable model assumptions — the six factor weights + the two gate cutoffs.
// Defaults are the original values; editing makes it "your model" (still SIMULATED).
// Composite is normalized by the weight sum so it stays 0–100 for any weights.
interface Assumptions { weights: Record<FactorKey, number>; scaleCut: number; condCut: number }
const DEFAULT_ASSUMPTIONS: Assumptions = {
  weights: { sponsorship: 0.25, trust: 0.20, workflow: 0.15, training: 0.15, comms: 0.15, incentives: 0.10 },
  scaleCut: 75, condCut: 60,
};
const weightSum = (w: Record<FactorKey, number>) => FACTOR_KEYS.reduce((a, k) => a + w[k], 0) || 1;
const compositeOf = (f: Factors, w: Record<FactorKey, number>) =>
  Math.round(FACTOR_KEYS.reduce((a, k) => a + w[k] * f[k], 0) / weightSum(w));
type Gate = { verdict: string; tone: BadgeTone };
const gateForOf = (c: number, A: Assumptions): Gate =>
  c >= A.scaleCut ? { verdict: "Scale", tone: "emerald" } : c >= A.condCut ? { verdict: "Scale with conditions", tone: "amber" } : { verdict: "Hold", tone: "rose" };

export function AdoptionReadiness() {
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? EL01_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(EL01_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const nativeScenario = SCENARIOS.find((s) => s.key === scenarioKey)!;
  const people = activeUc ? activeUc.payload.people : nativeScenario.people;
  const [factors, setFactors] = useState<Factors>(nativeScenario.defaults);

  const onScenario = (k: string) => {
    setScenarioKey(k);
    setActiveUcId(null);
    setFactors(SCENARIOS.find((s) => s.key === k)!.defaults);
  };
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? EL01_USE_CASES.find((u) => u.id === id) : null;
    setFactors(uc ? uc.payload.defaults : nativeScenario.defaults);
  };
  const setF = (key: FactorKey, v: number) => setFactors((f) => ({ ...f, [key]: v }));

  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const A = assumptions;
  const edited = JSON.stringify(A) !== JSON.stringify(DEFAULT_ASSUMPTIONS);

  // Restore a shared scenario (?cfg=) once on mount — scenario, factors, assumptions.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("cfg");
    if (!raw) return;
    try {
      const cfg = JSON.parse(atob(raw)) as { f?: Factors; a?: Partial<Assumptions>; sc?: string };
      if (cfg.sc) setScenarioKey(cfg.sc);
      if (cfg.f) setFactors(cfg.f);
      if (cfg.a) {
        const a = cfg.a;
        setAssumptions({
          weights: { ...DEFAULT_ASSUMPTIONS.weights, ...(a.weights ?? {}) },
          scaleCut: a.scaleCut ?? DEFAULT_ASSUMPTIONS.scaleCut,
          condCut: a.condCut ?? DEFAULT_ASSUMPTIONS.condCut,
        });
      }
    } catch { /* ignore malformed link */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareScenario = () => {
    const cfg = btoa(JSON.stringify({ f: factors, a: A, sc: activeUc ? undefined : scenarioKey }));
    const params = new URLSearchParams(window.location.search);
    params.set("cfg", cfg);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("Link copied — this exact scenario"), () => toast("Link is in the address bar"));
    } else {
      toast("Link is in the address bar");
    }
  };
  const resetAssumptions = () => { setAssumptions(DEFAULT_ASSUMPTIONS); toast("Assumptions reset to defaults"); };

  const c = compositeOf(factors, A.weights);
  const gate = gateForOf(c, A);
  const weak = FACTORS.filter((x) => factors[x.key] < 70).sort((a, b) => factors[a.key] - factors[b.key]);
  const priorities = weak.slice(0, 3);

  const buildAdoptionMemo = (): string => {
    const gnarr = c >= A.scaleCut
      ? "Readiness clears the bar — scale."
      : c >= A.condCut
      ? "Scale only with the fixes below committed and owned."
      : "Hold — the people aren't ready. Fix the weakest factors before scaling; a technically-working pilot still fails without them.";
    return [
      "# Adoption readiness memo",
      "",
      `**Program:** ${activeUc ? activeUc.title : nativeScenario.label} (~${people} users)`,
      `**Composite readiness:** ${c}/100 — ${gate.verdict}`,
      "",
      "## Factor scores",
      "",
      "| Factor | Weight | Score |",
      "| --- | --- | --- |",
      ...FACTORS.map((x) => `| ${x.label} | ${Math.round(A.weights[x.key] / weightSum(A.weights) * 100)}% | ${factors[x.key]} |`),
      "",
      "## Gate verdict",
      "",
      `${gate.verdict}. ${gnarr}`,
      "",
      "## Fix first (2-week plan)",
      "",
      priorities.length
        ? priorities.map((x, i) => `${i + 1}. **${x.label}** (${factors[x.key]}/100) — ${ACTION[x.key]}`).join("\n")
        : "_All factors above threshold — proceed to scale._",
    ].join("\n");
  };
  const onGenerate = () =>
    downloadMarkdown(`adoption-memo-${activeUc ? activeUc.id : scenarioKey}`, buildAdoptionMemo(), {
      scenario: activeUc ? activeUc.title : nativeScenario.label,
    });

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

        <UseCaseRail useCases={EL01_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        <LabToolbar>
          <ToolbarButton onClick={() => setDrawerOpen(true)} active={edited} title="Edit the model's weights and gate cutoffs">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Assumptions
            {edited && <span className="ml-1 rounded bg-white/25 px-1 py-px text-[10px] font-bold uppercase tracking-wide">your model</span>}
          </ToolbarButton>
          <ToolbarButton onClick={shareScenario} title="Copy a link that reproduces this exact scenario">
            <Share2 className="h-3.5 w-3.5" /> Share
          </ToolbarButton>
          <ToolbarButton onClick={resetAssumptions} title="Reset assumptions to the defaults">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </ToolbarButton>
          <ToolbarButton onClick={onGenerate} className="ml-auto" title="Download the adoption readiness memo as Markdown">
            <Download className="h-3.5 w-3.5" /> Readiness memo
          </ToolbarButton>
        </LabToolbar>

        <div className="mb-5 flex flex-wrap gap-2">
          {!activeUc && SCENARIOS.map((s) => (
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
                  <label className="text-xs font-medium text-slatey-400">{x.label} <span className="text-slatey-500">· {Math.round(A.weights[x.key] / weightSum(A.weights) * 100)}%</span></label>
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
                <div className="absolute inset-y-0 left-0 bg-rose-200" style={{ width: `${A.condCut}%` }} />
                <div className="absolute inset-y-0 bg-amber-200" style={{ left: `${A.condCut}%`, width: `${A.scaleCut - A.condCut}%` }} />
                <div className="absolute inset-y-0 right-0 bg-emerald-200" style={{ left: `${A.scaleCut}%` }} />
                <div className="absolute -top-0.5 h-4 w-[3px] rounded bg-ink" style={{ left: `calc(${c}% - 1px)` }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slatey-500"><span>Hold</span><span>{A.condCut}</span><span>{A.scaleCut}</span><span>Scale</span></div>
              <p className="mt-3 text-xs italic text-slatey-500">I gate below {A.condCut} because I&apos;ve watched pilots that scaled anyway die at week six — the trust wasn&apos;t there and the floor knew it.</p>
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
              <p className="mt-3 text-xs text-slatey-400"><span className="font-semibold text-ink">Always on:</span> one floor champion per ~{Math.max(10, Math.round(people / 60))} users, a two-week feedback loop, and a visible fix log so users see their input ship.</p>
            </Panel>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title={gate.verdict === "Hold" ? "Not ready — and scaling anyway is the expensive mistake" : gate.verdict === "Scale with conditions" ? "Conditional go — fix the flagged factors in parallel with the ramp" : "Ready to scale"} tone={gate.tone === "rose" ? "danger" : gate.tone === "amber" ? "warn" : "success"}>
            The composite is dragged most by <span className="font-semibold">{(weak[0]?.label ?? "nothing").toLowerCase()}</span>. Adoption is a trust problem wearing a training problem&apos;s clothes — spend the two weeks there, not on another demo.
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : `The model was never the risk. The ${people} people who have to trust it were.`}</p>
          {!activeUc && <p className="text-xs italic text-slatey-500">Resume echo — Gen AI rollouts at AMEX; the adoption half of the 4.5× scale story.</p>}
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

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Model assumptions">
          <div className="space-y-5">
            <p className="text-xs leading-relaxed text-slatey-400">
              These set how much each factor counts and where the gate draws its lines. Editing makes this{" "}
              <span className="font-semibold text-ink">your model</span> — still SIMULATED, now on your weights.
            </p>

            <div>
              <p className="stat-label mb-2">Factor weights <span className="font-normal text-slatey-500">· normalized to 100%</span></p>
              <div className="space-y-3">
                {FACTORS.map((x) => (
                  <AssumptionRow key={x.key} label={x.label} value={Math.round(A.weights[x.key] * 100)} min={0} max={40} step={1} suffix="%"
                    onChange={(v) => setAssumptions((p) => ({ ...p, weights: { ...p.weights, [x.key]: v / 100 } }))} />
                ))}
              </div>
            </div>

            <div>
              <p className="stat-label mb-2">Gate cutoffs</p>
              <div className="space-y-3">
                <AssumptionRow label="Scale at ≥" value={A.scaleCut} min={A.condCut + 1} max={95} step={1}
                  onChange={(v) => setAssumptions((p) => ({ ...p, scaleCut: Math.max(v, p.condCut + 1) }))} />
                <AssumptionRow label="Conditions at ≥" value={A.condCut} min={20} max={A.scaleCut - 1} step={1}
                  onChange={(v) => setAssumptions((p) => ({ ...p, condCut: Math.min(v, p.scaleCut - 1) }))} />
              </div>
            </div>

            <button onClick={resetAssumptions} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-400 transition-colors hover:border-primary/40 hover:text-ink">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
          </div>
        </Drawer>
        <ToastHost />
      </main>
    </div>
  );
}

function AssumptionRow({
  label, value, min, max, step, suffix, fixed, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string; fixed?: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slatey-400">{label}</label>
        <span className="font-mono text-xs font-semibold text-ink">{fixed !== undefined ? value.toFixed(fixed) : value}{suffix ?? ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
