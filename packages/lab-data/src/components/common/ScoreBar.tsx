import { cn } from "@data/lib/cn";

export function ScoreBar({
  value,
  max = 100,
  target,
  mode = "higher-better",
  showValue = true,
  suffix = "%",
  className,
}: {
  value: number;
  max?: number;
  target?: number;
  mode?: "higher-better" | "lower-better";
  showValue?: boolean;
  suffix?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let color = "bg-emerald-500";
  if (mode === "higher-better") {
    if (target !== undefined) {
      if (value < target - 12) color = "bg-rose-500";
      else if (value < target - 5) color = "bg-orange-500";
      else if (value < target) color = "bg-amber-500";
    } else if (value < 60) color = "bg-rose-500";
    else if (value < 80) color = "bg-amber-500";
  } else if (target !== undefined) {
    if (value > target * 1.4) color = "bg-rose-500";
    else if (value > target * 1.15) color = "bg-orange-500";
    else if (value > target) color = "bg-amber-500";
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
        {target !== undefined && (
          <div
            className="absolute top-0 h-full w-px bg-ink/40"
            style={{ left: `${Math.min(100, (target / max) * 100)}%` }}
            title={`Target ${target}${suffix}`}
          />
        )}
      </div>
      {showValue && (
        <div className="mt-1 flex justify-between text-[11px] text-slatey-400">
          <span className="font-medium text-slatey-300">
            {value}
            {suffix}
          </span>
          {target !== undefined && (
            <span>
              target {target}
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
