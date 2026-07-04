import { cn } from "@data/lib/cn";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { MetricTooltip } from "./MetricTooltip";

type Accent = "blue" | "emerald" | "amber" | "orange" | "rose";

const ACCENT_BG: Record<Accent, string> = {
  blue: "bg-primary",
  emerald: "bg-status-healthy",
  amber: "bg-status-watch",
  orange: "bg-status-risk",
  rose: "bg-status-critical",
};

export function KpiCard({
  label,
  value,
  unit,
  accent = "blue",
  target,
  trend,
  trendGood = true,
  interpretation,
  tooltip,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: Accent;
  target?: string;
  trend?: string;
  trendGood?: boolean;
  interpretation?: string;
  tooltip?: string;
  className?: string;
}) {
  const TrendIcon = trendGood ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={cn("panel panel-hover overflow-hidden", className)}>
      <div className={cn("h-1 rounded-t-xl", ACCENT_BG[accent])} />
      <div className="p-4">
        <div className="flex items-center gap-1">
          <span className="stat-label">{label}</span>
          {tooltip && <MetricTooltip text={tooltip} />}
        </div>
        <div className="mt-1.5 flex items-end gap-2">
          <div className="text-2xl font-semibold tracking-tight text-ink">
            {value}
            {unit && <span className="text-base font-medium text-slatey-400">{unit}</span>}
          </div>
          {trend && (
            <div
              className={cn(
                "mb-1 flex items-center gap-0.5 text-xs font-semibold",
                trendGood ? "text-emerald-700" : "text-rose-700",
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {trend}
            </div>
          )}
        </div>
        {target && <div className="mt-1 font-mono text-[11px] text-slatey-400">{target}</div>}
        {interpretation && <div className="mt-2 text-[13px] leading-snug text-slatey-300">{interpretation}</div>}
      </div>
    </div>
  );
}
