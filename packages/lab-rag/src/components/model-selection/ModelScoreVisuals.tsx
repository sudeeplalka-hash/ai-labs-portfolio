"use client";

import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip,
} from "recharts";
import { CHART_COLORS } from "@rag/lib/constants";
import { cn } from "@rag/lib/cn";
import { CRITERIA, type CriterionId, type ScoredModel } from "@rag/lib/model-selection/models";

const SHORT: Record<CriterionId, string> = {
  capability: "Capability",
  cost: "Cost",
  latency: "Latency",
  context: "Context",
  dataControl: "Data control",
  portability: "Portability",
  customization: "Custom",
  opsSimplicity: "Ops",
};

const SERIES = [CHART_COLORS.blue, CHART_COLORS.teal, CHART_COLORS.violet];

function barColor(score: number) {
  if (score >= 80) return CHART_COLORS.emerald;
  if (score >= 65) return CHART_COLORS.cyan;
  if (score >= 50) return CHART_COLORS.amber;
  if (score >= 35) return CHART_COLORS.orange;
  return CHART_COLORS.rose;
}

export function ModelScoreVisuals({
  ranked,
  focus,
}: {
  ranked: ScoredModel[];
  focus: ScoredModel;
}) {
  const top = ranked.slice(0, 3);
  const radarData = CRITERIA.map((c) => {
    const row: Record<string, number | string> = { criterion: SHORT[c.id] };
    top.forEach((t) => (row[t.model.name] = t.model.scores[c.id]));
    return row;
  });

  const totalWeighted = focus.contributions.reduce((a, c) => a + c.weighted, 0) || 1;
  const contrib = [...focus.contributions].sort((a, b) => b.weighted - a.weighted);
  const maxShare = Math.max(...contrib.map((c) => c.weighted / totalWeighted), 0.0001);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Capability profiles — the shape of each top candidate */}
      <div>
        <h3 className="text-sm font-semibold text-ink">Capability profiles</h3>
        <p className="mt-0.5 text-xs text-slatey-400">
          The shape of the top three candidates across all criteria. A bigger, rounder shape is a stronger all-rounder;
          a spiky shape is a specialist.
        </p>
        <div className="mt-2 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke={CHART_COLORS.grid} />
              <PolarAngleAxis dataKey="criterion" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              {top.map((t, i) => (
                <Radar
                  key={t.model.id}
                  name={t.model.name}
                  dataKey={t.model.name}
                  stroke={SERIES[i]}
                  fill={SERIES[i]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid rgba(21,36,51,0.12)", borderRadius: 8, fontSize: 12 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What drives the fit — live weighted contribution */}
      <div>
        <h3 className="text-sm font-semibold text-ink">
          What drives <span className="text-accent-cyan">{focus.model.name}</span>&rsquo;s fit
        </h3>
        <p className="mt-0.5 text-xs text-slatey-400">
          Each bar is how much a criterion contributes to the {focus.fit}-point fit right now (weight × score). Change a
          weight or profile and the bars re-proportion live — that&rsquo;s the lever turning priorities into a pick.
        </p>
        <div className="mt-3 space-y-2">
          {contrib.map((c) => {
            const share = c.weighted / totalWeighted;
            const pct = Math.round(share * 100);
            return (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-right text-[11px] text-slatey-400" title={c.label}>
                  {c.label}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-100">
                  <div
                    className={cn("h-full rounded transition-all", c.weight === 0 && "opacity-30")}
                    style={{ width: `${(share / maxShare) * 100}%`, background: barColor(c.score) }}
                  />
                </div>
                <span className="w-24 shrink-0 text-[10px] tabular-nums text-slatey-500">
                  {c.weight === 0 ? "muted" : `${pct}% · w${c.weight}·s${c.score}`}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slatey-400">
          Bar length = share of the fit it drives; color = how strong this model is on that axis (green strong → red
          weak). A long red bar is a heavily-weighted weakness; a long green bar is why it&rsquo;s winning.
        </p>
      </div>
    </div>
  );
}
