import { CheckCircle2, Loader2, Circle, AlertTriangle, XCircle, Workflow } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { StatusPill } from "./StatusPill";
import type { LiveTraceStep } from "@rag/types/liveLab";
import { cn } from "@rag/lib/cn";

function Icon({ status }: { status: LiveTraceStep["status"] }) {
  if (status === "Running") return <Loader2 className="h-4 w-4 animate-spin text-accent-cyan" />;
  if (status === "Complete") return <CheckCircle2 className="h-4 w-4 text-emerald-700" />;
  if (status === "Warning") return <AlertTriangle className="h-4 w-4 text-amber-700" />;
  if (status === "Failed") return <XCircle className="h-4 w-4 text-rose-700" />;
  return <Circle className="h-4 w-4 text-slatey-600" />;
}

export function ProcessingTimeline({
  steps,
  title = "Processing Timeline",
  description = "What the lab did to make the document searchable.",
}: {
  steps: LiveTraceStep[];
  title?: string;
  description?: string;
}) {
  return (
    <Panel>
      <SectionHeader title={title} description={description} icon={Workflow} />
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="relative flex gap-3">
            {i < steps.length - 1 && <span className="absolute left-[7px] top-6 h-[calc(100%-0.25rem)] w-px bg-slate-100" />}
            <span className="z-10 mt-0.5"><Icon status={s.status} /></span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn("text-sm font-medium", s.status === "Pending" ? "text-slatey-500" : "text-ink")}>{s.step}</span>
                <div className="flex items-center gap-2">
                  {s.status !== "Pending" && s.durationMs > 0 && (
                    <span className="font-mono text-[11px] text-slatey-500">{s.durationMs}ms</span>
                  )}
                  <StatusPill status={s.status} />
                </div>
              </div>
              {s.status !== "Pending" && (
                <>
                  <p className="mt-0.5 text-sm leading-relaxed text-slatey-400">{s.explanation}</p>
                  {s.technicalDetail && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slatey-600">{s.technicalDetail}</p>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
