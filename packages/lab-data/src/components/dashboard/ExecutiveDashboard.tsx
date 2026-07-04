"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Clock, TrendingUp, MessageSquareText, Calculator, PieChart } from "lucide-react";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { KpiCard } from "@data/components/common/KpiCard";
import { InsightCard } from "@data/components/common/InsightCard";
import { EffortDonut, TrendChart } from "@data/components/dashboard/Charts";
import { RoiCalculator } from "@data/components/dashboard/RoiCalculator";
import { DataSourceToggle, LiveEmpty, type DataSource } from "@data/components/dashboard/DataSourceToggle";
import { EXEC_KPIS, FUNNEL, TREND, EXEC_NARRATIVE } from "@data/data/dashboardData";
import { getSessions, type LabSession } from "@data/lib/live/session";
import { aggregateSessions } from "@data/lib/live/aggregate";

export function ExecutiveDashboard() {
  const [mode, setMode] = useState<DataSource>("demo");
  const [sessions, setSessions] = useState<LabSession[]>([]);
  useEffect(() => setSessions(getSessions()), []);
  const live = useMemo(() => aggregateSessions(sessions), [sessions]);

  const showLive = mode === "live";
  const kpis = showLive ? live.kpis : EXEC_KPIS;
  const funnel = showLive ? live.funnel : FUNNEL;
  const trend = showLive ? live.trend : TREND;
  const max = funnel.length ? funnel[0].value : 1;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slatey-400">
          {showLive ? `Computed from ${live.total} of your real sessions.` : "Demo data — toggle to recompute from your own activity."}
        </p>
        <DataSourceToggle value={mode} onChange={setMode} liveCount={sessions.length} />
      </div>

      {showLive && !live.hasData ? (
        <LiveEmpty />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <SectionHeader title="Ingestion funnel" description={showLive ? "Your files and where they end up" : "Files received this quarter and where they end up"} icon={Filter} />
              <div className="space-y-2.5">
                {funnel.map((f) => {
                  const w = max ? (f.value / max) * 100 : 0;
                  return (
                    <div key={f.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">{f.name}</span>
                        <span className="font-mono text-xs text-slatey-300">
                          {f.value.toLocaleString()} · {w.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-7 overflow-hidden rounded-md bg-slate-100">
                        <div className="flex h-full items-center rounded-md px-2" style={{ width: `${w}%`, background: f.color }}>
                          <span className="truncate text-[10px] text-white/90">{f.desc}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel className="flex flex-col">
              {showLive ? (
                <>
                  <SectionHeader title="Gate distribution" description="Your files by outcome" icon={PieChart} />
                  <div className="space-y-2.5">
                    {live.gateDist.map((g) => {
                      const w = live.total ? (g.n / live.total) * 100 : 0;
                      return (
                        <div key={g.label}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-ink">{g.label}</span>
                            <span className="font-mono text-xs text-slatey-300">{g.n}</span>
                          </div>
                          <div className="h-5 overflow-hidden rounded-md bg-slate-100">
                            <div className="h-full rounded-md" style={{ width: `${w}%`, background: g.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <SectionHeader title="Where the effort goes" description="Avg analyst hours per file" icon={Clock} />
                  <EffortDonut />
                </>
              )}
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel>
              <SectionHeader title="Readiness trend" description={showLive ? "First-pass approval by day" : "% of files approved on first pass vs. target"} icon={TrendingUp} />
              {trend.length > 0 ? <TrendChart data={trend} /> : <div className="py-12 text-center text-sm text-slatey-400">Not enough sessions yet for a trend.</div>}
            </Panel>
            <Panel>
              <SectionHeader title="What the numbers mean" icon={MessageSquareText} />
              {showLive ? (
                <div className="space-y-3">
                  <InsightCard title="From your activity" tone="info">
                    These metrics recompute from the {live.total} file{live.total === 1 ? "" : "s"} you&apos;ve run locally. Run
                    more in the Live Data Lab or Corpus Builder and this updates instantly.
                  </InsightCard>
                  <InsightCard title="Readiness" tone={live.kpis[1] && Number(live.kpis[1].value) >= 70 ? "success" : "warn"}>
                    {live.kpis[1]?.value}% of your files cleared the gate on first pass. Use the Fix-it loop and PII redaction to
                    lift the rest.
                  </InsightCard>
                </div>
              ) : (
                <div className="space-y-3">
                  {EXEC_NARRATIVE.map((n) => (
                    <InsightCard key={n.title} title={n.title} tone={n.tone}>
                      {n.body}
                    </InsightCard>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      <Panel className="mt-6">
        <SectionHeader title="ROI calculator" description="What automating data prep is worth at your volume" icon={Calculator} />
        <RoiCalculator />
      </Panel>
    </div>
  );
}
