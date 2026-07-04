import { cn } from "@rag/lib/cn";
import type { ProcessingStatus } from "@rag/types/liveLab";

const STYLES: Record<ProcessingStatus, string> = {
  Pending: "bg-slate-500/10 text-slate-300 ring-1 ring-inset ring-slate-500/30",
  Running: "bg-accent/10 text-accent-cyan ring-1 ring-inset ring-accent/30",
  Complete: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/30",
  Warning: "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/30",
  Failed: "bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/30",
};

export function StatusPill({ status }: { status: ProcessingStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", STYLES[status])}>
      {status === "Running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-cyan" />}
      {status}
    </span>
  );
}
