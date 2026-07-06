"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cpu, SlidersHorizontal, Server, Cloud, Globe, Check, Trophy, ArrowRight, ShieldCheck, Gauge, RotateCcw,
} from "lucide-react";
import { cn } from "@labs/design-system";
import { useProgram, type ProgramState } from "@labs/program-core";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { ModelScoreVisuals } from "./ModelScoreVisuals";
import { MetricTooltip } from "@rag/components/common/MetricTooltip";
import { InsightCard } from "@rag/components/common/InsightCard";
import { readHandoff } from "@rag/lib/handoff";
import {
  CRITERIA, MODELS, SCENARIOS, DEFAULT_SCENARIO, ENGINE_FACTORS, rankModels, topStrengths, keyWeakness, suggestScenario,
  type CriterionId, type Deployment, type ScoredModel,
} from "@rag/lib/model-selection/models";

const CHOICE_KEY = "apcc_model_choice";

const DEPLOY_ICON: Record<Deployment, React.ComponentType<{ className?: string }>> = {
  "Hosted API": Cloud,
  "Regional hosted": Globe,
  "Self-hosted (VPC / on-prem)": Server,
};

function fitColor(fit: number) {
  if (fit >= 75) return "bg-emerald-500";
  if (fit >= 62) return "bg-accent-cyan";
  if (fit >= 48) return "bg-amber-500";
  return "bg-rose-500";
}
// Compact headers, wrap to ~2 lines so the matrix fits without horizontal scroll.
const HEAD: Record<CriterionId, string> = {
  capability: "Capability & quality",
  cost: "Cost efficiency",
  latency: "Speed / latency",
  context: "Context headroom",
  dataControl: "Data residency",
  portability: "Portability",
  customization: "Fine tuning",
  opsSimplicity: "Ops simplicity",
};

function heatClass(score: number) {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-700";
  if (score >= 65) return "bg-accent/15 text-accent-cyan";
  if (score >= 50) return "bg-amber-500/15 text-amber-700";
  if (score >= 35) return "bg-orange-500/15 text-orange-700";
  return "bg-rose-500/15 text-rose-700";
}

export function ModelSelectionView() {
  const { mode, hydrated, update } = useProgram();
  const [activeScenario, setActiveScenario] = useState<string>(DEFAULT_SCENARIO);
  const [weights, setWeights] = useState<Record<CriterionId, number>>(
    () => ({ ...SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO)!.weights }),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<{ scenario: string; from: string } | null>(null);

  // Restore a prior choice, and in Live mode seed the scenario from the framed bet.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const saved = window.localStorage.getItem(CHOICE_KEY);
      if (saved) setSelectedId(saved);
    } catch {}
    if (mode === "demo") return;
    const h = readHandoff();
    if (h && (h.posture || h.risk)) {
      const sc = suggestScenario(h.posture, h.risk);
      if (sc !== DEFAULT_SCENARIO) {
        setActiveScenario(sc);
        setWeights({ ...SCENARIOS.find((s) => s.id === sc)!.weights });
        setSuggested({ scenario: sc, from: h.name });
      }
    }
  }, [hydrated, mode]);

  const ranked = useMemo(() => rankModels(weights), [weights]);
  const winner = ranked[0];
  const selected = selectedId ? ranked.find((r) => r.model.id === selectedId) ?? null : null;

  const pickScenario = (id: string) => {
    const sc = SCENARIOS.find((s) => s.id === id);
    if (!sc) return;
    setActiveScenario(id);
    setWeights({ ...sc.weights });
  };
  const setWeight = (id: CriterionId, v: number) => {
    setWeights((w) => ({ ...w, [id]: v }));
    setActiveScenario("custom");
  };
  const choose = (id: string) => {
    setSelectedId(id);
    try { window.localStorage.setItem(CHOICE_KEY, id); } catch {}
    // Carry the engine into the program spine (Live only) so Deploy and Realize
    // can name the model behind their cost/latency and ROI numbers.
    if (mode !== "demo") {
      const m = MODELS.find((x) => x.id === id);
      if (m) {
        const f = ENGINE_FACTORS[m.id] ?? { cost: 1, latency: 1 };
        update((d: ProgramState) => {
          d.rag = {
            ...d.rag,
            model: m.name,
            modelDeployment: m.deployment,
            modelCostNote: m.costNote,
            modelLatencyNote: m.latencyNote,
            modelCostFactor: f.cost,
            modelLatencyFactor: f.latency,
            modelCapability: m.scores.capability,
          };
        });
      }
    }
  };

  const scenarioLabel = SCENARIOS.find((s) => s.id === activeScenario)?.label ?? "Custom weights";

  return (
    <div className="space-y-6">
      {/* Scenario + depth */}
      <Panel>
        <SectionHeader
          icon={SlidersHorizontal}
          title="What matters most for this initiative?"
          description="Pick a priority profile, the ranking re-weights live. There's no universally best model, only the best fit for your constraints. Fine tune the criterion weights below, or inspect the full matrix at the bottom."
        />

        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => pickScenario(s.id)}
              title={s.blurb}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                activeScenario === s.id
                  ? "border-accent/40 bg-accent/10 text-accent-cyan"
                  : "border-line bg-white text-slatey-400 hover:border-accent/30 hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
          {activeScenario === "custom" && (
            <span className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-cyan">
              Custom weights
            </span>
          )}
        </div>

        {suggested && (
          <p className="mt-3 text-xs text-slatey-400">
            Suggested <span className="font-medium text-ink">{scenarioLabel}</span> from your framed bet
            {" "}&ldquo;{suggested.from}&rdquo;, change it anytime.
          </p>
        )}

        {/* Weight sliders */}
        <div className="mt-4 rounded-lg border border-line bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slatey-400">Criterion weights</span>
              <button
                onClick={() => pickScenario("balanced")}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slatey-400 hover:text-ink"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {CRITERIA.map((c) => (
                <label key={c.id} className="block">
                  <span className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slatey-300">
                      {c.label} <MetricTooltip text={c.hint} />
                    </span>
                    <span className="font-mono text-slatey-400">{weights[c.id]}</span>
                  </span>
                  <input
                    type="range" min={0} max={5} step={1}
                    value={weights[c.id]}
                    onChange={(e) => setWeight(c.id, Number(e.target.value))}
                    className="w-full accent-[#1f6fc4]"
                  />
                </label>
              ))}
            </div>
          </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ranked candidates */}
        <div className="space-y-3 lg:col-span-2">
          {ranked.map((r, i) => (
            <CandidateCard
              key={r.model.id}
              scored={r}
              rank={i}
              isWinner={i === 0}
              isSelected={selectedId === r.model.id}
              onChoose={() => choose(r.model.id)}
            />
          ))}
        </div>

        {/* Right rail: recommendation + selection + downstream */}
        <div className="space-y-4">
          <Panel>
            <SectionHeader icon={Trophy} title="Recommended" description={`For: ${scenarioLabel}`} />
            <p className="text-sm font-semibold text-ink">{winner.model.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={cn("h-full rounded-full", fitColor(winner.fit))} style={{ width: `${winner.fit}%` }} />
              </div>
              <span className="font-mono text-xs text-slatey-400">{winner.fit} fit</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slatey-300">
              Leads on <span className="font-medium text-ink">{topStrengths(winner).join(" and ")}</span> for this profile.
              {keyWeakness(winner) && (
                <> Watch its <span className="font-medium text-ink">{keyWeakness(winner)!.toLowerCase()}</span>.</>
              )}
            </p>
          </Panel>

          {selected ? (
            <InsightCard icon={ShieldCheck} tone="success" title={`Selected: ${selected.model.name}`}>
              Retrieval tuning next assumes this engine. Its cost and latency profile
              ({selected.model.costNote.toLowerCase()}, {selected.model.latencyNote.toLowerCase()}) becomes the
              starting point for the <span className="font-medium">AI Ops</span> cost-and-latency envelope, and its
              deployment ({selected.model.deployment}) feeds <span className="font-medium">Govern</span> vendor &amp;
              residency risk.
            </InsightCard>
          ) : (
            <InsightCard icon={ArrowRight} tone="info" title="Pick an engine to lock it in">
              Choosing a model carries its cost, latency, and deployment profile downstream into AI Ops and Govern, and frames the retrieval tuning you do next in this lab.
            </InsightCard>
          )}

          <InsightCard icon={Gauge} tone="warn" title="Choose, then revisit">
            Model choice and retrieval design co-evolve. Treat this as the starting gate, re-run it once your
            evaluations show where quality, cost, or latency actually bind.
          </InsightCard>
        </div>
      </div>

      {/* Visualize how weights turn into a pick */}
      <Panel>
        <SectionHeader
          icon={Gauge}
          title="How weighting changes the pick"
          description="See each candidate's profile, and exactly which criteria are driving the leader's fit right now."
        />
        <ModelScoreVisuals ranked={ranked} focus={selected ?? winner} />
      </Panel>

      {/* Full comparison matrix */}
      <Panel>
          <SectionHeader icon={Cpu} title="Full comparison matrix" description="Every candidate across every criterion (higher is better; cost, latency and ops are already inverted)." />
          <table className="data-table w-full table-fixed">
            <thead>
              <tr>
                <th className="w-[15%] text-left align-bottom">Model</th>
                {CRITERIA.map((c) => {
                  const words = HEAD[c.id].split(" ");
                  const last = words.pop()!;
                  const lead = words.join(" ");
                  return (
                    <th key={c.id} className="!whitespace-normal break-words px-1 align-bottom text-center text-[10px] font-semibold uppercase leading-tight tracking-tight">
                      {lead && <>{lead} </>}
                      {/* keep the last word + the "i" together so the icon never drops to its own line */}
                      <span className="whitespace-nowrap">{last}&nbsp;<MetricTooltip text={c.hint} className="align-middle normal-case" /></span>
                    </th>
                  );
                })}
                <th className="w-[6%] align-bottom text-center">Fit</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.model.id} className={cn(selectedId === r.model.id && "bg-accent/[0.04]")}>
                  <td className="break-words pr-2 align-middle text-xs font-medium text-ink">{r.model.name}</td>
                  {CRITERIA.map((c) => (
                    <td key={c.id} className="px-1 text-center align-middle">
                      <span className={cn("inline-block min-w-[2rem] rounded px-1 py-0.5 text-xs font-medium", heatClass(r.model.scores[c.id]))}>
                        {r.model.scores[c.id]}
                      </span>
                    </td>
                  ))}
                  <td className="text-center align-middle font-semibold text-ink">{r.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </Panel>
    </div>
  );
}

function CandidateCard({
  scored, rank, isWinner, isSelected, onChoose,
}: {
  scored: ScoredModel;
  rank: number;
  isWinner: boolean;
  isSelected: boolean;
  onChoose: () => void;
}) {
  const m = scored.model;
  const DepIcon = DEPLOY_ICON[m.deployment];
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 transition-shadow",
        isSelected ? "border-accent/50 ring-2 ring-accent/30" : "border-line hover:shadow-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-slatey-500">#{rank + 1}</span>
            <h3 className="text-sm font-semibold text-ink">{m.name}</h3>
            {isWinner && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <Trophy className="h-3 w-3" /> Best fit
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slatey-400">{m.tagline}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold text-ink">{scored.fit}</div>
          <div className="text-[10px] uppercase tracking-wide text-slatey-500">fit</div>
        </div>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", fitColor(scored.fit))} style={{ width: `${scored.fit}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          <DepIcon className="h-3 w-3" /> {m.deployment}
        </span>
        <span className={cn("rounded-md px-2 py-0.5 font-medium", m.openWeights ? "bg-accent/10 text-accent-cyan" : "bg-slate-100 text-slate-600")}>
          {m.openWeights ? "Open weights" : "Closed / API"}
        </span>
        <span className="text-slatey-400">{m.costNote} · {m.latencyNote} · {m.contextNote}</span>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <p className="text-slatey-400"><span className="font-medium text-emerald-700">Best for:</span> {m.bestFor}</p>
        <p className="text-slatey-400"><span className="font-medium text-orange-700">Watch out:</span> {m.watchOut}</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-slatey-500">{m.examples}</span>
        <button
          onClick={onChoose}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            isSelected
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
              : "bg-primary text-white hover:bg-primary-dark",
          )}
        >
          {isSelected ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select this engine"}
        </button>
      </div>
    </div>
  );
}
