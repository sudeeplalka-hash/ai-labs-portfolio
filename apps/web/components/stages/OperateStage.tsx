"use client";

// Stage 07 · Operate — day-2 continuous operations (SPEC-OPERATE-STAGE-V2).
// Placed after Realize on the rail, scoped from Deploy onward, and defined by the
// loop-back: drift/staleness evidence becomes a retrain / re-index / rollback /
// re-scope decision that feeds Frame, Build, Deploy, Realize, and Govern.
// Three views, one authored incident arc, capped scope. SIMULATED throughout —
// seeded deterministic series, never telemetry.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, Radar, RefreshCcw, ArrowLeft, Download, AlertTriangle, Repeat,
} from "lucide-react";
import {
  Panel, Badge, KpiCard, InsightCard, LiveBadge, FreshnessStamp, type BadgeTone,
} from "@labs/design-system";
import {
  useProgramSource,
  deriveOpsSeries, detectSignals, deriveDay2Incident, valueAtRisk,
  buildOperateFeedback, buildWeeklyOpsReview, buildIncidentReport,
  type OpsSignal, type RemediationOption, type OperateFeedback,
} from "@labs/program-core";

type View = "health" | "incident" | "loop";
const SEV_TONE: Record<string, BadgeTone> = { high: "rose", med: "amber", low: "slate" };
const LOOP_LABEL: Record<string, string> = { frame: "→ Frame (re-scope)", build: "→ Build (retrain/re-index)", deploy: "→ Deploy (restrict)" };

function downloadMd(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function OperateStage() {
  const { src, isDemo, update, hydrated } = useProgramSource();
  const [view, setView] = useState<View>("health");
  const [decision, setDecision] = useState<RemediationOption | null>(null);

  const series = useMemo(() => deriveOpsSeries(src), [src]);
  const signals = useMemo(() => detectSignals(series, src.initiative?.meta?.governanceTier), [series, src]);
  const incident = useMemo(() => deriveDay2Incident(src), [src]);
  const vaR = useMemo(() => valueAtRisk(src, series), [src, series]);
  const feedback: OperateFeedback | null = useMemo(
    () => (decision ? buildOperateFeedback(src, decision, series) : null),
    [decision, src, series],
  );

  // Persist the loop-back. Imperative (user-triggered on the decision click, not a
  // render effect) so it can't retrigger itself; `iteration` isn't read by the ops
  // series, so the write doesn't cascade. Live-gated: the demo archetype is
  // ephemeral, so we never write over it (ProgramProvider's writer rule).
  const choose = (op: RemediationOption) => {
    setDecision(op);
    if (isDemo) return;
    const fb = buildOperateFeedback(src, op, series);
    const nextAction = fb.toFrame?.title ?? fb.toBuild?.task ?? fb.toDeploy?.action ?? fb.decision.label;
    update((draft) => {
      draft.iteration = { ...(draft.iteration ?? {}), recommendedNextAction: nextAction };
    });
  };

  if (!hydrated) return null;

  // Gate: placed after Realize on the rail, scoped from Deploy onward — so the
  // stage unlocks when Deploy is complete, not when Realize is.
  const deployDone = src.progress?.deploy === "done" || !!src.seededSample;
  if (!deployDone) {
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <Repeat className="mx-auto mb-2 h-6 w-6 text-slatey-500" />
        <h1 className="text-lg font-semibold text-ink">Operate unlocks after Deploy</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slatey-400">
          Day-2 operations watch the system you shipped. Complete <Link href="/deploy" className="font-medium text-primary hover:underline">Deploy</Link> first
          — or load the sample program from the home page to see a full operations history.
        </p>
      </Panel>
    );
  }

  const last = series.weeks[series.weeks.length - 1];
  const driftPts = Math.round((series.canaryBaselinePct - last.canaryPassPct) * 10) / 10;

  // Mini chart: availability (flat, green) vs canary pass (declining) — the trap in one picture.
  const W = 560, H = 120, PAD = 26;
  const xf = (i: number) => PAD + (i / (series.weeks.length - 1)) * (W - PAD * 2);
  const yf = (v: number) => H - PAD - ((v - 55) / 45) * (H - PAD * 2);
  const line = (pick: (w: (typeof series.weeks)[number]) => number) =>
    series.weeks.map((w, i) => `${xf(i).toFixed(1)},${yf(pick(w)).toFixed(1)}`).join(" ");

  return (
    <div>
      {/* Stage header */}
      <div className="mb-5">
        <p className="eyebrow mb-1">Stage 07 · the loop</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Operate — Day-2 Observability</h1>
          <LiveBadge mode="SIMULATED" />
          <FreshnessStamp freshness={{ lastVerified: "2026-07-04", note: "Seeded deterministic series — authored to teach the pattern" }} />
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
          Govern asked <em>is it allowed</em>. Realize asked <em>is it worth it</em>. This stage asks the third question —
          <span className="font-semibold text-ink"> is it still working</span> — and when the answer turns, it doesn&apos;t file a ticket.
          It loops back: retrain, re-index, rollback, or re-scope.
        </p>
      </div>

      {/* View switch */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {([
          { k: "health", label: "Health board", Icon: Activity },
          { k: "incident", label: "Incident arc", Icon: AlertTriangle },
          { k: "loop", label: "The loop", Icon: RefreshCcw },
        ] as { k: View; label: string; Icon: typeof Activity }[]).map(({ k, label, Icon }) => (
          <button key={k} onClick={() => setView(k)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${view === k ? "border-primary bg-primary text-white" : "border-line bg-white text-slatey-400 hover:border-primary/40 hover:text-ink"}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        <button
          onClick={() => downloadMd(`weekly-ops-review-wk${last.week}.md`, buildWeeklyOpsReview(src, series, signals))}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slatey-400 hover:border-primary/40 hover:text-ink">
          <Download className="h-3.5 w-3.5" /> Weekly ops review
        </button>
      </div>

      {/* ---------------- View 1 · Health board ---------------- */}
      {view === "health" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="System SLOs" value={`${last.availabilityPct}%`} tone="healthy" interpretation={`p95 ${last.p95Ms}ms · errors ${last.errorRatePct}% — all green`} />
            <KpiCard label="Canary pass rate" value={`${last.canaryPassPct}%`} tone={driftPts >= 8 ? "critical" : "watch"} interpretation={`vs ${series.canaryBaselinePct}% Build baseline (−${driftPts}pts)`} />
            <KpiCard label="Index staleness" value={`${last.indexStaleDays}d`} tone={last.indexStaleDays > 21 ? "critical" : "watch"} interpretation={`recall ${last.retrievalRecallPct}% · citations ${last.citationRatePct}%`} />
            <KpiCard label="Cost / task" value={`$${last.costPerTaskUsd.toFixed(3)}`} tone="watch" interpretation={`cache ${last.cacheHitPct}% · ${last.loopAnomalies} agent anomalies`} />
          </div>

          <Panel>
            <p className="stat-label mb-2">The trap, in one picture <span className="font-normal text-slatey-500">· 12 weeks</span></p>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img"
                aria-label="Availability stays green while canary eval pass-rate declines over 12 weeks">
                <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e4e7eb" />
                <polyline points={line((w) => w.availabilityPct)} fill="none" stroke="#16a34a" strokeWidth="2" />
                <polyline points={line((w) => w.canaryPassPct)} fill="none" stroke="#e24b4a" strokeWidth="2.5" />
                <text x={W - PAD} y={yf(last.availabilityPct) - 6} textAnchor="end" fontSize="10" className="fill-emerald-700">availability (SLO view)</text>
                <text x={W - PAD} y={yf(last.canaryPassPct) + 14} textAnchor="end" fontSize="10" className="fill-rose-600">canary evals (answer view)</text>
              </svg>
            </div>
            <p className="mt-2 text-[11px] text-slatey-500">
              Same system, two truths. The SLO dashboard never blinks; the canary set — inherited from Build&apos;s golden dataset — has been sliding since week 5.
              This is EL-04&apos;s reported-vs-actual lesson at model altitude.
            </p>
          </Panel>

          <Panel>
            <p className="stat-label mb-2">Open signals <span className="font-normal text-slatey-500">· detection rationale shown — that&apos;s the observability line item</span></p>
            <div className="space-y-2">
              {signals.map((sg: OpsSignal) => (
                <div key={sg.key} className="rounded-lg border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SEV_TONE[sg.severity]}>{sg.severity}</Badge>
                    <span className="text-sm font-semibold text-ink">{sg.title}</span>
                    <span className="ml-auto font-mono text-[11px] text-slatey-500">week {sg.week}</span>
                  </div>
                  <p className="mt-1 text-xs text-slatey-300">{sg.evidence}</p>
                  <p className="mt-1 text-[11px] text-slatey-500"><Radar className="mr-1 inline h-3 w-3" />Monitor: {sg.monitorHint}</p>
                </div>
              ))}
            </div>
          </Panel>

          <InsightCard title={`Value at risk while this stays open: $${Math.round(vaR.valueAtRiskUsd / 1000)}k/yr`} tone="danger">
            {vaR.basis}. That number flows to Realize — degraded quality is not an engineering detail, it&apos;s unrealized value.
            The decision lives in the <button onClick={() => setView("incident")} className="font-semibold text-primary hover:underline">incident arc</button>.
          </InsightCard>
        </div>
      )}

      {/* ---------------- View 2 · Incident arc ---------------- */}
      {view === "incident" && (
        <div className="space-y-4">
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="rose">{incident.id}</Badge>
              <h2 className="text-sm font-semibold text-ink">{incident.title}</h2>
            </div>
            <ol className="mt-3 space-y-1.5 border-l-2 border-line pl-4 text-xs text-slatey-300">
              {incident.timeline.map((t) => (
                <li key={t.at}><span className="font-mono font-semibold text-ink">{t.at}</span> — {t.what}</li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-slatey-500"><span className="font-semibold text-slatey-400">Blast radius:</span> {incident.blastRadius}</p>
          </Panel>

          <div>
            <p className="stat-label mb-2">The decision — four options, one call</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {incident.options.map((op) => {
                const on = decision?.key === op.key;
                return (
                  <button key={op.key} onClick={() => choose(op)}
                    className={`rounded-xl border bg-white p-3 text-left shadow-card transition hover:shadow-cardhover ${on ? "border-primary ring-1 ring-primary/40" : "border-line"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{op.label}</p>
                      <Badge tone={SEV_TONE[op.risk]}>{op.risk}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slatey-500">${Math.round(op.costUsd / 1000)}k · {op.timeWeeks}w · {LOOP_LABEL[op.loopTarget]}</p>
                    <p className="mt-1.5 text-[11px] leading-snug text-slatey-400">{op.rationale}</p>
                    <p className="mt-1 text-[11px] italic leading-snug text-slatey-500">Tradeoff: {op.tradeoff}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {feedback && (
            <InsightCard title={`Decision recorded: ${feedback.decision.label}`} tone="success">
              Loop-back issued {LOOP_LABEL[feedback.decision.loopTarget]} — see <button onClick={() => setView("loop")} className="font-semibold text-primary hover:underline">the loop</button>.
              <span className="mt-1 block">
                <button onClick={() => downloadMd(`incident-report-${incident.id}.md`, buildIncidentReport(src, incident, feedback))}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                  <Download className="h-3.5 w-3.5" /> Download the incident report
                </button>
              </span>
            </InsightCard>
          )}
        </div>
      )}

      {/* ---------------- View 3 · The loop ---------------- */}
      {view === "loop" && (
        <div className="space-y-4">
          {!feedback ? (
            <Panel>
              <p className="text-sm text-slatey-400">
                No decision yet. The loop renders what Operate <em>sends</em> — make the call in the{" "}
                <button onClick={() => setView("incident")} className="font-medium text-primary hover:underline">incident arc</button> first.
              </p>
            </Panel>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {feedback.toBuild && (
                  <Panel><p className="stat-label mb-1">→ Build</p>
                    <p className="text-sm text-ink">{feedback.toBuild.task}</p>
                    <p className="mt-1 text-[11px] text-slatey-500">Evidence attached: {feedback.toBuild.evidence}</p>
                    <Link href="/build" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Build →</Link>
                  </Panel>
                )}
                {feedback.toFrame && (
                  <Panel><p className="stat-label mb-1">→ Frame · next cycle</p>
                    <p className="text-sm text-ink">{feedback.toFrame.title}</p>
                    <p className="mt-1 text-[11px] text-slatey-500">{feedback.toFrame.rationale}</p>
                    <Link href="/frame" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Frame →</Link>
                  </Panel>
                )}
                {feedback.toDeploy && (
                  <Panel><p className="stat-label mb-1">→ Deploy</p>
                    <p className="text-sm text-ink">{feedback.toDeploy.action}</p>
                    <Link href="/deploy" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Deploy →</Link>
                  </Panel>
                )}
                <Panel><p className="stat-label mb-1">→ Realize</p>
                  <p className="text-sm text-ink">{feedback.toRealize.note}</p>
                  <Link href="/realize" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Realize →</Link>
                </Panel>
                <Panel><p className="stat-label mb-1">→ Govern · evidence pack</p>
                  <p className="text-sm text-ink">{feedback.toGovern.evidenceNote}</p>
                  <Link href="/govern" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open Govern →</Link>
                </Panel>
              </div>
              <InsightCard title="This arrow is the stage" tone="info">
                A lifecycle that ends at Realize is a project. One that loops through Operate is a program — the running system
                teaches the next Frame what to build. That feedback arrow is the most senior thing on this map.
              </InsightCard>
            </>
          )}
        </div>
      )}

      {/* Credibility block */}
      <div className="mt-8 space-y-4 border-t border-line pt-6">
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold">Steering-committee takeaway:</span> Green SLOs don&apos;t mean right answers.
          Infra health and answer health drift apart silently — you operate the loop, not the model.
        </p>
        <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
          <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
          <div className="mt-2 space-y-1 text-xs leading-relaxed">
            <p>Series: seeded deterministic 12-week history (`deriveOpsSeries`) — same initiative, same operations story. The canary baseline traces to Build&apos;s golden-set faithfulness; SLOs are engineered to stay green while canary evals decay, because that divergence is the lesson.</p>
            <p>Detection: threshold + trend detectors (`detectSignals`) with the real-world monitor named per signal; the staleness threshold tightens for high governance tiers.</p>
            <p>The loop: a chosen remediation builds a typed feedback contract (`buildOperateFeedback`) routing to Frame / Build / Deploy, with value-at-risk computed for Realize and an evidence note for Govern. Engine is tested in `program-core` (determinism, detector logic, routing).</p>
          </div>
        </details>
        <p className="text-xs text-slatey-500">
          <span className="font-semibold text-slatey-400">Limitations:</span> the incident is authored and the series are seeded math —
          real day-2 needs telemetry ingestion, alert routing, and on-call. This stage shows the signals worth buying and the decision they exist to trigger, not a monitoring product.
        </p>
      </div>
    </div>
  );
}
