"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Check, X, GitCompareArrows, AlertTriangle, TrendingUp } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { ReleaseBadge } from "@rag/components/common/Badge";
import { ScoreBar } from "@rag/components/common/ScoreBar";
import { evaluationRuns } from "@rag/data/evaluationRuns";
import { calculateRegressionStatus } from "@rag/lib/scoring";
import { CHART_COLORS, THRESHOLDS } from "@rag/lib/constants";
import { cn } from "@rag/lib/cn";
import type { EvaluationRun } from "@rag/types";

const REG_STYLES: Record<EvaluationRun["regressionStatus"], string> = {
  "No Regression": "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/30",
  Watch: "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/30",
  Regression: "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/30",
};

function delta(cur: number, prev: number, lowerBetter = false) {
  const d = +(cur - prev).toFixed(1);
  const good = lowerBetter ? d < 0 : d > 0;
  if (d === 0) return <span className="text-slatey-500">0</span>;
  return (
    <span className={good ? "text-emerald-700" : "text-rose-700"}>
      {d > 0 ? "+" : ""}
      {d}
    </span>
  );
}

export function EvaluationsView() {
  const [selectedId, setSelectedId] = useState(evaluationRuns[evaluationRuns.length - 1].id);
  const idx = evaluationRuns.findIndex((r) => r.id === selectedId);
  const run = evaluationRuns[idx];
  const prev = idx > 0 ? evaluationRuns[idx - 1] : undefined;
  const regression = calculateRegressionStatus(run, prev);

  const scorecard: { label: string; key: keyof typeof run.metrics; value: number; target: number }[] = [
    { label: "Overall Score", key: "overallScore", value: run.metrics.overallScore, target: THRESHOLDS.overallScore },
    { label: "Retrieval Quality", key: "retrievalQuality", value: run.metrics.retrievalQuality, target: 85 },
    { label: "Faithfulness", key: "faithfulness", value: run.metrics.faithfulness, target: THRESHOLDS.faithfulness },
    { label: "Citation Accuracy", key: "citationAccuracy", value: run.metrics.citationAccuracy, target: THRESHOLDS.citationAccuracy },
    { label: "Pass Rate", key: "passRate", value: run.metrics.passRate, target: 85 },
    { label: "High risk Pass Rate", key: "highRiskPassRate", value: run.metrics.highRiskPassRate, target: THRESHOLDS.highRiskPassRate },
  ];

  const compareData = evaluationRuns.map((r) => ({
    name: "v" + r.id.split("-v")[1],
    overall: r.metrics.overallScore,
    citation: r.metrics.citationAccuracy,
    selected: r.id === selectedId,
  }));

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeader title="Evaluation Runs" description="Select a run to inspect its scorecard and regression analysis." icon={GitCompareArrows} />
        <table className="data-table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Date</th>
              <th>Retriever</th>
              <th>Reranker</th>
              <th>Prompt</th>
              <th>Cases</th>
              <th>Overall</th>
              <th>Pass</th>
              <th>Critical Fails</th>
              <th>Regression</th>
              <th>Release</th>
            </tr>
          </thead>
          <tbody>
            {evaluationRuns.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={cn("cursor-pointer", r.id === selectedId && "bg-accent/10")}
              >
                <td className="font-medium text-ink">{r.runName}</td>
                <td className="whitespace-nowrap text-slatey-400">{r.runDate}</td>
                <td className="text-slatey-300">{r.retrieverStrategy}</td>
                <td>
                  {r.rerankerEnabled ? (
                    <Check className="h-4 w-4 text-emerald-700" />
                  ) : (
                    <X className="h-4 w-4 text-slatey-500" />
                  )}
                </td>
                <td className="whitespace-nowrap text-slatey-400">{r.promptVersion}</td>
                <td>{r.testCaseCount}</td>
                <td className="font-semibold text-ink">{r.metrics.overallScore}</td>
                <td>{r.metrics.passRate}%</td>
                <td className={r.metrics.criticalFailures > 0 ? "font-semibold text-rose-700" : "text-emerald-700"}>
                  {r.metrics.criticalFailures}
                </td>
                <td>
                  <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", REG_STYLES[r.regressionStatus])}>
                    {r.regressionStatus}
                  </span>
                </td>
                <td>
                  <ReleaseBadge recommendation={r.releaseRecommendation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader title={`Scorecard · ${run.runName}`} description={run.notes} icon={TrendingUp} />
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {scorecard.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slatey-300">{row.label}</span>
                  {prev && (
                    <span className="text-[11px] text-slatey-500">
                      vs prev: {delta(row.value, prev.metrics[row.key] as number)}
                    </span>
                  )}
                </div>
                <ScoreBar value={row.value} target={row.target} />
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Hallucination Risk" value={`${run.metrics.hallucinationRisk}%`} />
            <Stat label="Avg Latency" value={`${(run.metrics.avgLatencyMs / 1000).toFixed(2)}s`} />
            <Stat label="P95 Latency" value={`${(run.metrics.p95LatencyMs / 1000).toFixed(2)}s`} warn={run.metrics.p95LatencyMs > THRESHOLDS.p95LatencyMs} />
            <Stat label="Cost / Query" value={`$${run.metrics.costPerQuery.toFixed(3)}`} />
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Regression Analysis" description={prev ? `vs ${prev.runName}` : "No prior run"} icon={AlertTriangle} />
          <div className={cn("mb-3 inline-flex rounded-md px-2.5 py-1 text-sm font-medium", REG_STYLES[regression.status])}>
            {regression.status}
          </div>
          <ul className="space-y-2">
            {regression.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slatey-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slatey-500" />
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border border-slate-100 bg-navy-850/50 p-3">
            <p className="stat-label">Release Recommendation</p>
            <div className="mt-1.5">
              <ReleaseBadge recommendation={run.releaseRecommendation} />
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionHeader title="Run Comparison" description="Overall score and citation accuracy across all runs. Selected run highlighted." />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="name" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
              <YAxis domain={[50, 100]} stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 }}
                cursor={{ fill: "rgba(148,163,184,0.06)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="overall" name="Overall" radius={[3, 3, 0, 0]}>
                {compareData.map((d, i) => (
                  <Cell key={i} fill={d.selected ? CHART_COLORS.cyan : CHART_COLORS.blue} />
                ))}
              </Bar>
              <Bar dataKey="citation" name="Citation Accuracy" radius={[3, 3, 0, 0]}>
                {compareData.map((d, i) => (
                  <Cell key={i} fill={d.selected ? CHART_COLORS.amber : CHART_COLORS.orange} fillOpacity={d.selected ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-navy-850/50 p-3">
      <p className="stat-label">{label}</p>
      <p className={cn("mt-1 text-base font-semibold", warn ? "text-orange-700" : "text-ink")}>{value}</p>
    </div>
  );
}
