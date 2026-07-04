"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { qualityTrend } from "@rag/data/evaluationRuns";
import { CHART_COLORS } from "@rag/lib/constants";

export function QualityTrendChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={qualityTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="shortName" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
          <YAxis domain={[50, 100]} stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(21,36,51,0.12)",
              borderRadius: 8, boxShadow: "0 8px 24px -8px rgba(21,36,51,0.16)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#152433" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={80} stroke={CHART_COLORS.amber} strokeDasharray="4 4" label={{ value: "Prod baseline 80", fill: CHART_COLORS.amber, fontSize: 10, position: "insideTopRight" }} />
          <Line type="monotone" dataKey="overall" name="Overall" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="retrieval" name="Retrieval" stroke={CHART_COLORS.teal} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="citation" name="Citation" stroke={CHART_COLORS.orange} strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="faithfulness" name="Faithfulness" stroke={CHART_COLORS.violet} strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
