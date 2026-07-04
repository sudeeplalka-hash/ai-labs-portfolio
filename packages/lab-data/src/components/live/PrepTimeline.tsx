import { Check, Loader2, Circle, type LucideIcon } from "lucide-react";
import { cn } from "@data/lib/cn";

export interface PrepStep {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const PREP_STEPS: PrepStep[] = [];

export function PrepTimeline({
  steps,
  activeIndex,
  done,
}: {
  steps: { key: string; label: string; icon: LucideIcon }[];
  activeIndex: number;
  done: boolean;
}) {
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const state = done || i < activeIndex ? "done" : i === activeIndex ? "run" : "idle";
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
                state === "done" && "bg-emerald-50 text-emerald-600 ring-emerald-600/20",
                state === "run" && "bg-primary/10 text-primary ring-primary/25",
                state === "idle" && "bg-slate-100 text-slatey-400 ring-line",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className={cn("flex-1 text-sm", state === "idle" ? "text-slatey-400" : "text-slatey-200")}>
              {s.label}
            </span>
            <span>
              {state === "done" && <Check className="h-4 w-4 text-emerald-600" />}
              {state === "run" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {state === "idle" && <Circle className="h-4 w-4 text-slatey-400/50" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}
