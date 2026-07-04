"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { retrievalExperiments } from "@rag/data/retrievalExperiments";
import { CHART_COLORS } from "@rag/lib/constants";

export function RetrievalStrategyChart() {
  const data = retrievalExperiments.map((e) => ({
    name: e.strategy.replace(" search", "").replace(" retrieval", ""),
    "Precision@5": Math.round(e.precisionAtK * 100),
    "Recall@5": Math.round(e.recallAtK * 100),
    NDCG: Math.round(e.ndcg * 100),
  }));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 40 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="name" stroke={CHART_COLORS.axis} fontSize={11} tickLine={false} angle={-20} textAnchor="end" interval={0} height={60} />
          <YAxis domain={[40, 100]} stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)", fontSize: 12 }}
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Precision@5" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} />
          <Bar dataKey="Recall@5" fill={CHART_COLORS.teal} radius={[3, 3, 0, 0]} />
          <Bar dataKey="NDCG" fill={CHART_COLORS.violet} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
