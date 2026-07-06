"use client";

import { useEffect, useMemo, useState } from "react";
import { GitBranch, Gauge, Table2, Check, Minus, X } from "lucide-react";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { ScoreBar } from "@data/components/common/ScoreBar";
import { Badge } from "@data/components/common/Badge";
import { DataSourceToggle, LiveEmpty, type DataSource } from "@data/components/dashboard/DataSourceToggle";
import { STAGES, QUALITY_DIMS, FILE_ROWS } from "@data/data/dashboardData";
import { getSessions, type LabSession } from "@data/lib/live/session";
import { aggregateSessions } from "@data/lib/live/aggregate";

function StatusIcon({ s }: { s: "ok" | "warn" | "fail" }) {
  if (s === "ok") return <Check className="h-4 w-4 text-status-healthy" />;
  if (s === "warn") return <Minus className="h-4 w-4 text-status-watch" />;
  return <X className="h-4 w-4 text-status-critical" />;
}

export function TechnicalDashboard() {
  const [mode, setMode] = useState<DataSource>("demo");
  const [sessions, setSessions] = useState<LabSession[]>([]);
  useEffect(() => setSessions(getSessions()), []);
  const live = useMemo(() => aggregateSessions(sessions), [sessions]);

  const showLive = mode === "live";
  const quality = showLive ? live.quality : QUALITY_DIMS;
  const files = showLive ? live.files : FILE_ROWS;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slatey-400">
          {showLive ? `Quality & files from ${live.total} of your real sessions.` : "Demo data, toggle to recompute from your own activity."}
        </p>
        <DataSourceToggle value={mode} onChange={setMode} liveCount={sessions.length} />
      </div>

      {showLive && !live.hasData ? (
        <LiveEmpty />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {!showLive && (
              <Panel className="lg:col-span-2">
                <SectionHeader title="Pipeline stages" description="Throughput and yield per transform on the latest batch (2,140 files in)" icon={GitBranch} />
                <div className="space-y-3">
                  {STAGES.map((s) => {
                    const col = s.yield >= 95 ? "#16a34a" : s.yield >= 88 ? "#d97706" : "#ea580c";
                    const w = (s.out / s.inn) * 100;
                    return (
                      <div key={s.name} className="rounded-lg border border-line p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">{s.name}</span>
                          <span className="font-mono text-xs" style={{ color: col }}>
                            {s.yield}% yield
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-slatey-300">{s.desc}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${w}%`, background: col }} />
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slatey-400">
                          {s.inn.toLocaleString()} in → {s.out.toLocaleString()} out
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            <Panel className={showLive ? "lg:col-span-3" : ""}>
              <SectionHeader title="Quality dimensions" description={showLive ? "Your batch score vs target" : "Batch score vs target"} icon={Gauge} />
              <div className={showLive ? "grid gap-x-8 gap-y-4 sm:grid-cols-2" : "space-y-4"}>
                {quality.map((q) => (
                  <div key={q.label}>
                    <div className="mb-1 text-sm font-medium text-ink">{q.label}</div>
                    <ScoreBar value={q.value} target={q.target} mode={q.mode} suffix={q.suffix} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="mt-6">
            <SectionHeader title={showLive ? "Your recent files" : "Recent files"} description="Per-stage status across the last submissions" icon={Table2} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slatey-400">
                    <th className="py-2 pr-4 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Profiled</th>
                    <th className="px-3 py-2 font-semibold">Cleaned</th>
                    <th className="px-3 py-2 font-semibold">PII cleared</th>
                    <th className="px-3 py-2 font-semibold">Chunks</th>
                    <th className="px-3 py-2 font-semibold">Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {files.map((r, i) => (
                    <tr key={`${r.name}-${i}`} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-2.5 pr-4 font-mono text-[13px] text-slatey-100">{r.name}</td>
                      <td className="px-3 py-2.5">
                        <Badge color="slate">{r.type}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusIcon s={r.profiled} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusIcon s={r.cleaned} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusIcon s={r.pii} />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[13px] text-slatey-200">{r.chunks}</td>
                      <td className="px-3 py-2.5">
                        <Badge color={r.gate.color}>{r.gate.label}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
