"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { AlertTriangle, ListChecks } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { GateBadge } from "@rag/components/common/Badge";
import { useLiveTraces } from "./useLiveTraces";
import { LiveEmptyState } from "./LiveEmptyState";
import { CHART_COLORS } from "@rag/lib/constants";

const tip = { contentStyle: { background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 }, cursor: { fill: "rgba(21,36,51,0.04)" } };

export function LiveFailureAnalysis() {
  const { mounted, traces } = useLiveTraces();

  const { reasons, flagged } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of traces) {
      if (t.evaluation.qualityGateStatus === "Passed") continue;
      for (const r of t.evaluation.failureReasons) {
        if (/no major quality issues/i.test(r)) continue;
        counts.set(r, (counts.get(r) ?? 0) + 1);
      }
    }
    const reasons = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const flagged = traces.filter((t) => t.evaluation.qualityGateStatus !== "Passed");
    return { reasons, flagged };
  }, [traces]);

  if (!mounted) return <div className="h-40 animate-pulse rounded-xl border border-line bg-white" />;
  if (traces.length === 0) return <LiveEmptyState what="A breakdown of your failure patterns" />;

  if (flagged.length === 0) {
    return (
      <Panel className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <ListChecks className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-ink">No failures yet</p>
        <p className="max-w-md text-sm text-slatey-400">All {traces.length} of your questions passed the quality gate. Try a harder or out-of-scope question to see how the evaluator flags failure patterns.</p>
      </Panel>
    );
  }

  const palette = [CHART_COLORS.rose, CHART_COLORS.orange, CHART_COLORS.amber, CHART_COLORS.violet, CHART_COLORS.blue, CHART_COLORS.teal];

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeader title="Failure patterns (live)" description={`Reasons across your ${flagged.length} flagged answer${flagged.length === 1 ? "" : "s"}.`} icon={AlertTriangle} />
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reasons} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke={CHART_COLORS.axis} fontSize={11} width={180} tickLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {reasons.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Flagged questions" description="Your questions where the evaluator raised a Warning or Failed gate." />
        {flagged.slice(0, 10).map((t) => (
          <div key={t.id} className="border-b border-line py-3 last:border-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink">{t.question}</p>
              <GateBadge status={t.evaluation.qualityGateStatus} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {t.evaluation.failureReasons.filter((r) => !/no major quality issues/i.test(r)).slice(0, 4).map((r, i) => (
                <span key={i} className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700 ring-1 ring-inset ring-amber-600/20">{r}</span>
              ))}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
