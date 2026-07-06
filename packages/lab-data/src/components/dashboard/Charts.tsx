"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { EFFORT, TREND } from "@data/data/dashboardData";

const tooltipStyle = {
  background: "#fff",
  border: "1px solid rgba(21,36,51,.12)",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(21,36,51,.10)",
  fontSize: 12,
  color: "#46586b",
  padding: "8px 10px",
};

export function EffortDonut() {
  const total = EFFORT.reduce((a, b) => a + b.hrs, 0);
  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={EFFORT} dataKey="hrs" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={86} paddingAngle={2} stroke="#fff" strokeWidth={2}>
              {EFFORT.map((e) => (
                <Cell key={e.name} fill={e.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, n: unknown) => [`${v as number} hrs/file`, n as string]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold tracking-tight text-ink">{total.toFixed(1)}</div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-slatey-400">hrs/file</div>
        </div>
      </div>

      {/* Breakdown, fills the space and shows the actual split, not just colors */}
      <ul className="mt-5 flex-1 space-y-2.5">
        {EFFORT.map((e) => {
          const pct = Math.round((e.hrs / total) * 100);
          return (
            <li key={e.name} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
              <span className="flex-1 truncate text-slatey-300">{e.name}</span>
              <span className="font-mono text-xs text-slatey-400">{e.hrs.toFixed(1)} hrs</span>
              <span className="w-9 text-right font-mono text-xs font-medium text-slatey-500">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TrendChart({ data = TREND }: { data?: { month: string; ready: number; target: number }[] }) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="rgba(21,36,51,.08)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5f6f81" }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#5f6f81" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, n: unknown) => [`${v as number}%`, n === "ready" ? "First-pass approval" : "Target"]} />
          <Line type="monotone" dataKey="ready" stroke="#1f6fc4" strokeWidth={2} dot={{ r: 3, fill: "#1f6fc4" }} name="ready" />
          <Line type="monotone" dataKey="target" stroke="#7c8a9a" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="target" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
