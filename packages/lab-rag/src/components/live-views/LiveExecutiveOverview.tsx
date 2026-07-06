"use client";

import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, Gauge, ShieldAlert } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { InsightCard } from "@rag/components/common/InsightCard";
import { KpiCard } from "@rag/components/dashboard/KpiCard";
import { useLiveTraces } from "./useLiveTraces";
import { LiveEmptyState } from "./LiveEmptyState";
import { aggregateLiveMetrics } from "@rag/lib/live-lab/liveMetrics";
import { calculateProductionReadinessLevel } from "@rag/lib/scoring";
import { statusFromScore, statusFromRiskValue } from "@rag/lib/formatting";
import { CHART_COLORS } from "@rag/lib/constants";
import type { KpiMetric, Status } from "@rag/types";

const tip = { contentStyle: { background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 } };

export function LiveExecutiveOverview() {
  const { mounted, traces } = useLiveTraces();
  const m = useMemo(() => aggregateLiveMetrics(traces), [traces]);

  if (!mounted) return <div className="h-40 animate-pulse rounded-xl border border-line bg-white" />;
  if (traces.length === 0) return <LiveEmptyState what="A live executive summary of your answers" />;

  const mk = (id: string, label: string, value: number, unit: string, target: number, lower: boolean, interp: string): KpiMetric => ({
    id, label, value, unit, target,
    status: (lower ? statusFromRiskValue(value, target) : statusFromScore(value, target)) as Status,
    interpretation: interp,
    description: interp,
  });

  const kpis: KpiMetric[] = [
    { id: "q", label: "Questions evaluated", value: m.questionsAsked, status: "Healthy", interpretation: "Total questions you've run through the lab.", description: "Total questions you've run through the lab." },
    mk("overall", "Avg Overall Quality", m.averageOverallQuality, "%", 80, false, "Composite trust score across your questions."),
    mk("retr", "Avg Retrieval Relevance", m.averageRetrievalRelevance, "%", 80, false, "How well evidence matched your questions."),
    mk("faith", "Avg Faithfulness", m.averageFaithfulness, "%", 85, false, "How grounded answers were in evidence."),
    mk("cite", "Avg Citation Accuracy", m.averageCitationAccuracy, "%", 85, false, "Whether citations supported the claims."),
    mk("halluc", "Avg Hallucination Risk", m.averageHallucinationRisk, "%", 8, true, "Risk of unsupported content. Lower is better."),
  ];

  const trend = [...traces].reverse().map((t, i) => ({ n: i + 1, quality: t.evaluation.overallQuality }));
  const gateData = [
    { name: "Passed", value: m.passedQualityGates, color: CHART_COLORS.emerald },
    { name: "Warning", value: m.warningQualityGates, color: CHART_COLORS.amber },
    { name: "Failed", value: m.failedQualityGates, color: CHART_COLORS.rose },
  ].filter((d) => d.value > 0);

  const readiness = calculateProductionReadinessLevel(m.averageOverallQuality);

  return (
    <div className="space-y-6">
      <InsightCard title="Live summary, from your lab sessions" icon={Activity} tone="info">
        These metrics are computed from the {m.questionsAsked} question{m.questionsAsked === 1 ? "" : "s"} you've asked in the Lab.
        The same enterprise views the demo illustrates, populated by your own documents and questions.
      </InsightCard>

      <div>
        <SectionHeader title="Headline Metrics (live)" description="Averaged across your questions." icon={Activity} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {kpis.map((k) => (
            <KpiCard key={k.id} kpi={k} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader title="Quality Trend" description="Overall quality per question, in order asked." />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="n" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
                <Tooltip {...tip} />
                <ReferenceLine y={80} stroke={CHART_COLORS.amber} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="quality" name="Overall quality" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHeader title="Quality Gates" description="Pass / warning / fail mix." icon={ShieldAlert} />
          {gateData.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gateData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {gateData.map((d) => <Cell key={d.name} fill={d.color} stroke="#ffffff" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slatey-400">No gate results yet.</p>}
        </Panel>
      </div>

      <Panel>
        <SectionHeader title="Production Readiness (live)" icon={Gauge} />
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-ink">Level {readiness.level}</span>
          <span className="text-sm text-slatey-400">of 5 · {readiness.name}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slatey-400">
          Based on your average overall quality of {m.averageOverallQuality}%. {m.humanReviewRequiredCount} answer
          {m.humanReviewRequiredCount === 1 ? "" : "s"} flagged for human review.
        </p>
      </Panel>
    </div>
  );
}
