"use client";

import { useState } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";
import { Zap, AlertTriangle, Activity, ShieldAlert } from "lucide-react";
import { Badge, cn } from "@labs/design-system";
import type { Baseline, DeployLevers, IncidentType, IncidentRun } from "../engine/types";
import { runIncident } from "../engine/model";

const TYPES: { id: IncidentType; label: string; icon: typeof Zap }[] = [
  { id: "spike", label: "Traffic spike", icon: Zap },
  { id: "regression", label: "Model regression", icon: Activity },
  { id: "outage", label: "Retrieval outage", icon: ShieldAlert },
];

const RUNBOOK = ["Detect (alert fires)", "Triage & page on-call", "Mitigate (shed load / roll back)", "Recover to SLO", "Postmortem"];

export function IncidentPanel({ baseline, levers }: { baseline: Baseline; levers: DeployLevers }) {
  const [run, setRun] = useState<IncidentRun | null>(null);
  const [type, setType] = useState<IncidentType | null>(null);

  function fire(t: IncidentType) { setType(t); setRun(runIncident(baseline, levers, t)); }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slatey-200">Inject incident:</span>
        {TYPES.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => fire(id)}
            className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              type === id ? "border-rose-400 bg-rose-50 text-rose-700" : "border-line bg-white text-slatey-300 hover:border-slatey-500")}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {!run ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-slatey-500" />
          <p className="text-sm text-slatey-400">Fire an incident to watch alerts trip, the error budget burn, and the system recover.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Badge tone="rose"><ShieldAlert className="h-3 w-3" /> {run.label}</Badge>
            <span className="text-xs text-slatey-400">MTTR <b className="font-mono text-ink">{run.mttrMin} min</b></span>
            <span className="text-xs text-slatey-400">Error budget burned <b className="font-mono text-ink">{run.budgetBurnPct}%</b></span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={run.ticks} margin={{ top: 6, right: 8, bottom: 4, left: 0 }}>
              <ReferenceArea x1={3} x2={15} fill="#fee2e2" fillOpacity={0.5} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#5f6f81" }} label={{ value: "minutes", position: "insideBottom", offset: -2, fontSize: 10, fill: "#5f6f81" }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#5f6f81" }} label={{ value: "p95 ms", angle: -90, position: "insideLeft", fontSize: 10, fill: "#5f6f81" }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#5f6f81" }} />
              <Tooltip contentStyle={{ border: "1px solid rgba(21,36,51,.12)", borderRadius: 8, fontSize: 12 }} />
              <Area yAxisId="l" dataKey="p95" name="p95 (ms)" stroke="#1f6fc4" fill="#1f6fc4" fillOpacity={0.12} strokeWidth={2} isAnimationActive />
              <Line yAxisId="r" dataKey="errorRatePct" name="error %" stroke="#dc2626" strokeWidth={2} dot={false} isAnimationActive />
            </ComposedChart>
          </ResponsiveContainer>
          <ol className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {RUNBOOK.map((step, i) => (
              <li key={i} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-slatey-400">
                <span className="font-mono text-slatey-500">{i + 1}</span> {step}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
