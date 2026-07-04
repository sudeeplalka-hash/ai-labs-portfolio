"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { queryTraces } from "@rag/data/queryTraces";
import { calculateRiskDistribution } from "@rag/lib/scoring";
import { RISK_COLORS } from "@rag/lib/constants";
import type { RiskLevel } from "@rag/types";

export function RiskBreakdown() {
  const dist = calculateRiskDistribution(queryTraces);
  const data = (Object.keys(dist) as RiskLevel[]).map((k) => ({ name: k, value: dist[k] }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={RISK_COLORS[d.name as RiskLevel]} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
