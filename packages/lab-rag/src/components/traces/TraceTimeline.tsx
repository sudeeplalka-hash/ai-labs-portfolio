import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@rag/lib/cn";
import type { TraceTimelineStep } from "@rag/types";

const ICONS = {
  Completed: { Icon: CheckCircle2, color: "text-emerald-700" },
  Warning: { Icon: AlertTriangle, color: "text-amber-700" },
  Failed: { Icon: XCircle, color: "text-rose-700" },
};

export function TraceTimeline({ steps }: { steps: TraceTimelineStep[] }) {
  return (
    <ol className="relative space-y-3 pl-2">
      {steps.map((s, i) => {
        const { Icon, color } = ICONS[s.status];
        return (
          <li key={i} className="relative flex gap-3">
            {i < steps.length - 1 && (
              <span className="absolute left-[7px] top-5 h-[calc(100%+0.25rem)] w-px bg-slate-100" />
            )}
            <Icon className={cn("z-10 mt-0.5 h-4 w-4 shrink-0", color)} />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink">{s.step}</span>
                <span className="shrink-0 font-mono text-[11px] text-slatey-500">{s.durationMs}ms</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slatey-400">{s.notes}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
