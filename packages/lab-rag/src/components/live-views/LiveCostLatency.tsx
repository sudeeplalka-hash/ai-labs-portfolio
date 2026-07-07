"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Gauge, Coins } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { useLiveTraces } from "./useLiveTraces";
import { LiveEmptyState } from "./LiveEmptyState";
import { CHART_COLORS } from "@rag/lib/constants";

const tip = { contentStyle: { background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 }, cursor: { fill: "rgba(21,36,51,0.04)" } };
const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0);
const stageDur = (timeline: { step: string; durationMs: number }[], key: string) => timeline.find((s) => s.step.toLowerCase().includes(key))?.durationMs ?? 0;

export function LiveCostLatency() {
  const { mounted, traces } = useLiveTraces();
  const ordered = useMemo(() => [...traces].reverse(), [traces]);

  if (!mounted) return <div className="h-40 animate-pulse rounded-xl border border-line bg-white" />;
  if (traces.length === 0) return <LiveEmptyState what="Latency, cost, and token usage" />;

  const cards = [
    { label: "Avg latency", value: `${Math.round(avg(traces.map((t) => t.latencyMs)))}ms` },
    { label: "Avg cost / query", value: `$${(avg(traces.map((t) => t.estimatedCost))).toFixed(5)}` },
    { label: "Avg retrieve", value: `${Math.round(avg(traces.map((t) => stageDur(t.timeline, "retriev"))))}ms` },
    { label: "Avg generate", value: `${Math.round(avg(traces.map((t) => stageDur(t.timeline, "generat"))))}ms` },
    { label: "Avg evaluate", value: `${Math.round(avg(traces.map((t) => stageDur(t.timeline, "evaluat"))))}ms` },
    { label: "Questions", value: String(traces.length) },
  ];

  const latencyData = ordered.map((t, i) => ({
    n: i + 1,
    retrieve: stageDur(t.timeline, "retriev"),
    generate: stageDur(t.timeline, "generat"),
    evaluate: stageDur(t.timeline, "evaluat"),
  }));
  const costData = ordered.map((t, i) => ({ n: i + 1, cost: t.estimatedCost }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="panel p-4">
            <p className="stat-label">{c.label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader title="Latency breakdown" description="Per question retrieve / generate / evaluate time." icon={Gauge} />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="n" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="retrieve" stackId="a" name="Retrieve" fill={CHART_COLORS.blue} />
                <Bar dataKey="generate" stackId="a" name="Generate" fill={CHART_COLORS.teal} />
                <Bar dataKey="evaluate" stackId="a" name="Evaluate" fill={CHART_COLORS.violet} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <SectionHeader title="Cost per query" description="Estimated with a sample pricing profile." icon={Coins} />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costData} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="n" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} tickFormatter={(v) => `$${v.toFixed(4)}`} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="cost" name="Cost / query" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
