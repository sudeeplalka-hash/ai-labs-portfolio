"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { operations, qualityTradeoffs } from "@rag/data/operations";
import { CHART_COLORS } from "@rag/lib/constants";

const tip = {
  contentStyle: { background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 },
  cursor: { fill: "rgba(148,163,184,0.06)" },
};

const data = operations.map((o) => ({
  date: o.date.slice(5),
  avg: +(o.avgLatencyMs / 1000).toFixed(2),
  p95: +(o.p95LatencyMs / 1000).toFixed(2),
  cost: o.costPerQuery,
  tokens: o.tokenUsage,
}));

export function LatencyChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="date" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} />
          <YAxis domain={[0, 5]} stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
          <Tooltip {...tip} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={4} stroke={CHART_COLORS.rose} strokeDasharray="4 4" label={{ value: "SLA 4s", fill: CHART_COLORS.rose, fontSize: 10, position: "insideTopRight" }} />
          <Area type="monotone" dataKey="avg" name="Avg latency (s)" stroke={CHART_COLORS.teal} fill={CHART_COLORS.teal} fillOpacity={0.12} strokeWidth={2} />
          <Line type="monotone" dataKey="p95" name="P95 latency (s)" stroke={CHART_COLORS.orange} strokeWidth={2.5} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="date" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} />
          <YAxis domain={[0, 0.05]} stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip {...tip} />
          <ReferenceLine y={0.045} stroke={CHART_COLORS.amber} strokeDasharray="4 4" label={{ value: "Target $0.045", fill: CHART_COLORS.amber, fontSize: 10, position: "insideTopRight" }} />
          <Line type="monotone" dataKey="cost" name="Cost / query" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TokenChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="date" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} />
          <YAxis stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} />
          <Tooltip {...tip} />
          <Bar dataKey="tokens" name="Tokens / query" fill={CHART_COLORS.violet} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TradeoffChart({ x, label }: { x: "cost" | "p95"; label: string }) {
  const pts = qualityTradeoffs.map((d) => ({ x: d[x], y: d.quality, run: d.run }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} />
          <XAxis type="number" dataKey="x" name={label} stroke={CHART_COLORS.axis} fontSize={11} tickLine={false}
            tickFormatter={(v) => (x === "cost" ? `$${v}` : `${v}s`)} />
          <YAxis type="number" dataKey="y" name="Quality" domain={[60, 82]} stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} />
          <ZAxis range={[80, 80]} />
          <Tooltip {...tip} cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, n: string) => [n === "x" ? (x === "cost" ? `$${v}` : `${v}s`) : v, n === "x" ? label : "Quality"]} />
          <Scatter data={pts} fill={CHART_COLORS.cyan} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
