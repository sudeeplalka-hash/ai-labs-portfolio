import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@rag/lib/cn";
import type { TrendDirection } from "@rag/types";

// goodWhen lets a downward trend (e.g. risk dropping) render as positive.
export function TrendIndicator({
  direction,
  value,
  suffix = "",
  goodWhen = "up",
  className,
}: {
  direction: TrendDirection;
  value?: number;
  suffix?: string;
  goodWhen?: "up" | "down";
  className?: string;
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const isGood =
    direction === "flat" ? null : (direction === goodWhen ? true : false);
  const color =
    isGood === null
      ? "text-slatey-400"
      : isGood
      ? "text-emerald-700"
      : "text-rose-700";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", color, className)}>
      <Icon className="h-3.5 w-3.5" />
      {value !== undefined && (
        <span>
          {value > 0 ? "+" : ""}
          {value}
          {suffix}
        </span>
      )}
    </span>
  );
}
