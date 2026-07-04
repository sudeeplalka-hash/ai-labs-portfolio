"use client";

// EL-04 · Delivery Health & RAID Radar (Collection 4 · control room).
// The lesson: reported status hides trajectory. The board pairs each workstream's
// reported RAG with its ACTUAL health and TREND, the mini-plot exposes the one that
// "reads green but is sinking," and selecting a workstream drafts the leadership
// status narrative that ends in a decision ask. SIMULATED — logic is deterministic
// and defensible; a live narrative variant can plug into LIVE_MODEL later.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Panel, Badge, TrendIndicator, KpiCard, InsightCard, LiveBadge, FreshnessStamp } from "@labs/design-system";
import {
  SCENARIOS, HEALTH_LABEL, HEALTH_TONE, HEALTH_X, TREND_Y, SEV_TONE,
  statusWord, trendWord, healthIndex, type RaidItem,
} from "./portfolioData";

export function RaidRadar() {
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const scenario = SCENARIOS.find((s) => s.key === scenarioKey)!;
  const gapWs = scenario.workstreams.find((w) => w.reported !== w.actual) ?? scenario.workstreams[0];
  const [selectedId, setSelectedId] = useState(gapWs.id);
  const selected = scenario.workstreams.find((w) => w.id === selectedId) ?? gapWs;

  const onScenario = (k: string) => {
    setScenarioKey(k);
    const s = SCENARIOS.find((x) => x.key === k)!;
    setSelectedId((s.workstreams.find((w) => w.reported !== w.actual) ?? s.workstreams[0]).id);
  };

  const idx = healthIndex(scenario.workstreams);
  const atRisk = scenario.workstreams.filter((w) => w.actual !== "green").length;
  const gaps = scenario.workstreams.filter((w) => w.reported !== w.actual).length;
  const idxTone = idx >= 80 ? "healthy" : idx >= 60 ? "watch" : idx >= 40 ? "risk" : "critical";

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">EL-04</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Engagement Leadership · Control room</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Delivery Health &amp; RAID Radar</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            A steering board should report <span className="font-semibold text-ink">trajectory, not snapshots</span>.
            Each workstream pairs its reported RAG with the health it actually has once the trend is priced in — so the
            one that <span className="font-semibold text-ink">reads green but is sinking</span> can&apos;t hide.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {SCENARIOS.map((s) => {
            const on = s.key === scenarioKey;
            return (
              <button key={s.key} onClick={() => onScenario(s.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
                {s.label}
              </button>
            );
          })}
          <span className="text-[11px] text-slatey-500">{scenario.note}</span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Portfolio health" value={idx} suffix="/100" tone={idxTone} interpretation="Actual health, trend priced in" />
          <KpiCard label="Workstreams at risk" value={`${atRisk}/${scenario.workstreams.length}`} tone={atRisk >= 2 ? "risk" : "watch"} interpretation="Actual amber or red" />
          <KpiCard label="Reported-vs-actual gaps" value={gaps} tone={gaps >= 1 ? "critical" : "healthy"} interpretation="Green on paper, worse in reality" />
          <KpiCard label="This period" value="Week 6" tone="neutral" interpretation="Trend window: last 3 weeks" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="space-y-3">
              {scenario.workstreams.map((w) => {
                const gap = w.reported !== w.actual;
                const on = w.id === selectedId;
                return (
                  <button key={w.id} onClick={() => setSelectedId(w.id)}
                    className={`w-full rounded-xl border bg-white p-4 text-left shadow-card transition hover:shadow-cardhover ${on ? "border-primary ring-1 ring-primary/30" : "border-line"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-ink">{w.name}</h3>
                        <p className="mt-0.5 text-[11px] text-slatey-500">{w.owner}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 ${on ? "text-primary" : "text-slatey-500"}`} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slatey-500">Reported</span>
                      <Badge tone={HEALTH_TONE[w.reported]}>{HEALTH_LABEL[w.reported]}</Badge>
                      <span className="text-[11px] text-slatey-500">· Actual</span>
                      <Badge tone={HEALTH_TONE[w.actual]}>{HEALTH_LABEL[w.actual]}</Badge>
                      <TrendIndicator direction={w.trend} value={w.delta} suffix="pt" goodWhen="up" />
                    </div>
                    {gap && (
                      <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">
                        Reads {HEALTH_LABEL[w.reported].toLowerCase()}, trending {HEALTH_LABEL[w.actual].toLowerCase()} — trajectory hidden by the milestone view.
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <Panel className="mt-4">
              <p className="stat-label mb-2">Health × trajectory</p>
              <div className="relative mx-auto h-40 w-full max-w-md rounded-lg border border-line bg-slate-50/60">
                <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] text-slatey-500">improving ↑</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slatey-500">↓ deteriorating</span>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slatey-500">worse</span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slatey-500">better</span>
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-line" />
                <div className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-br-lg bg-rose-500/[0.06]" />
                {scenario.workstreams.map((w) => {
                  const left = `${HEALTH_X[w.actual] * 100}%`;
                  const top = `${(1 - TREND_Y[w.trend]) * 100}%`;
                  const dot = w.reported === "green" ? "bg-emerald-500" : w.reported === "amber" ? "bg-amber-500" : "bg-rose-500";
                  const sel = w.id === selectedId;
                  return (
                    <button key={w.id} onClick={() => setSelectedId(w.id)} aria-label={`${w.name}: reported ${HEALTH_LABEL[w.reported]}, actual ${HEALTH_LABEL[w.actual]}`} title={w.name}
                      className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
                      <span className={`block rounded-full ring-2 ring-white ${dot} ${sel ? "h-4 w-4" : "h-3 w-3"} ${w.reported !== w.actual ? "outline outline-2 outline-rose-500/60" : ""}`} />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slatey-500">Dot color = <span className="font-medium">reported</span> status; position = actual health × trend. A green dot in the shaded corner is the trap.</p>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{selected.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Badge tone={HEALTH_TONE[selected.actual]}>{HEALTH_LABEL[selected.actual]}</Badge>
                  <TrendIndicator direction={selected.trend} value={selected.delta} suffix="pt" goodWhen="up" />
                </div>
              </div>
              <p className="mt-1 text-xs text-slatey-400">{selected.summary}</p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <RaidBlock title="Risks" items={selected.raid.risks} />
                <RaidBlock title="Issues" items={selected.raid.issues} />
                <RaidBlock title="Dependencies" items={selected.raid.dependencies} />
                <RaidBlock title="Assumptions" items={selected.raid.assumptions.map((t) => ({ text: t }))} />
              </div>
            </Panel>

            <Panel>
              <p className="stat-label mb-2">Auto-drafted leadership status</p>
              <div className="space-y-2 text-sm leading-relaxed text-slatey-300">
                <p><span className="font-semibold text-ink">Status.</span> {selected.name} is {statusWord(selected.actual)} ({HEALTH_LABEL[selected.reported].toLowerCase()} as reported, {HEALTH_LABEL[selected.actual].toLowerCase()} on trajectory, {trendWord(selected.trend)}).</p>
                <p><span className="font-semibold text-ink">What changed.</span> {selected.brief.whatChanged}</p>
                <p><span className="font-semibold text-ink">Watch.</span> {selected.brief.topConcern}</p>
                <p className="rounded-md bg-primary-soft px-3 py-2 text-primary-dark"><span className="font-semibold">Ask.</span> {selected.brief.ask}</p>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-6">
          <InsightCard title="The reported-vs-actual gap" tone={gaps >= 1 ? "danger" : "success"}>
            {gaps >= 1
              ? `${gaps} workstream${gaps > 1 ? "s report" : " reports"} healthier than reality. A green status with a downward arrow is a yellow that hasn't surfaced yet — the milestone view rewards "on schedule" and stays silent on quality and adoption.`
              : "No reported-vs-actual gaps this period — reported status matches trajectory."}
          </InsightCard>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-semibold">Steering-committee takeaway:</span> Green with a downward arrow is yellow. Report trajectory or get surprised.
          </p>
          <p className="text-xs italic text-slatey-500">Resume echo — the weekly reality of multi-portfolio EM work at AMEX.</p>

          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Stack: Next.js (static) + the shared design system; client-side state only.</p>
              <p>Data: authored sample portfolios (finserv + telecom), each workstream carrying reported vs actual RAG, a 3-week trend, and RAID items — shared with EL-10.</p>
              <p>Health index = mean of actual-health scores (green 100 / amber 60 / red 25); the radar plots actual-health × trend with reported status as dot color, so a green dot in the deteriorating-but-looks-better corner is the trap.</p>
              <p>Narrative: deterministic template over the workstream&apos;s authored brief, disciplined into Status → What changed → Watch → Ask. A LIVE variant can generate the prose via LIVE_MODEL without changing the structure.</p>
            </div>
          </details>

          <p className="text-xs text-slatey-500">
            <span className="font-semibold text-slatey-400">Limitations:</span> sample data is illustrative, not a live feed; the reported-vs-actual gap is engineered into the data to teach the pattern. In production this reads from the delivery tracker and the eval/adoption telemetry.
          </p>
        </div>
      </main>
    </div>
  );
}

function RaidBlock({ title, items }: { title: string; items: RaidItem[] }) {
  return (
    <div>
      <p className="mb-1 font-semibold text-slatey-400">{title} <span className="font-normal text-slatey-500">· {items.length}</span></p>
      {items.length === 0 ? (
        <p className="text-slatey-500">—</p>
      ) : (
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-1.5 text-slatey-300">
              {it.sev && <Badge tone={SEV_TONE[it.sev]} className="mt-px shrink-0">{it.sev}</Badge>}
              <span className="leading-snug">{it.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
