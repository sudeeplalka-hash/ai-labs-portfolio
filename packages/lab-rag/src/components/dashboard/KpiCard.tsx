import { StatusBadge } from "@rag/components/common/Badge";
import { TrendIndicator } from "@rag/components/common/TrendIndicator";
import { MetricTooltip } from "@rag/components/common/MetricTooltip";
import type { KpiMetric, Status } from "@rag/types";
import { cn } from "@rag/lib/cn";

// Status-colored top accent for fast scanning (JIRA-style).
const ACCENT: Record<Status, string> = {
  Healthy: "bg-emerald-500",
  Watch: "bg-amber-500",
  "At Risk": "bg-orange-500",
  Critical: "bg-rose-500",
};

export function KpiCard({ kpi }: { kpi: KpiMetric }) {
  const lowerBetter = kpi.id === "hallucination" || kpi.id === "critical-failures";
  return (
    <div className="panel panel-hover relative flex flex-col gap-3 p-4 pt-[18px] animate-fade-in">
      <span className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", ACCENT[kpi.status])} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="stat-label">{kpi.label}</span>
          <MetricTooltip text={kpi.description} />
        </div>
        <StatusBadge status={kpi.status} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-ink">
          {kpi.unit === "$" ? "$" : ""}
          {kpi.value}
          {kpi.unit && kpi.unit !== "$" ? kpi.unit : ""}
        </span>
        {kpi.trendValue !== undefined && kpi.trendDirection && (
          <TrendIndicator
            direction={kpi.trendDirection}
            value={kpi.trendValue}
            suffix={kpi.unit === "%" ? "%" : ""}
            goodWhen={lowerBetter ? "down" : "up"}
          />
        )}
      </div>
      {kpi.target !== undefined && (
        <div className="text-[11px] text-slatey-500">
          Target {kpi.unit === "$" ? "$" : ""}
          {kpi.target}
          {kpi.unit && kpi.unit !== "$" ? kpi.unit : ""}
        </div>
      )}
      <p className="text-xs leading-relaxed text-slatey-400">{kpi.interpretation}</p>
    </div>
  );
}
