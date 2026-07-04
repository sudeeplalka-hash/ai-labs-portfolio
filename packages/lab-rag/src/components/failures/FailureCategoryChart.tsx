"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { failureCategories } from "@rag/data/failureAnalysis";
import { RISK_COLORS } from "@rag/lib/constants";

export function FailureCategoryChart() {
  const data = [...failureCategories].sort((a, b) => b.count - a.count);
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
          <XAxis type="number" stroke="#7e8eac" fontSize={12} tickLine={false} />
          <YAxis type="category" dataKey="name" stroke="#7e8eac" fontSize={11} width={140} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 }}
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {data.map((d) => (
              <Cell key={d.id} fill={RISK_COLORS[d.severity]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
