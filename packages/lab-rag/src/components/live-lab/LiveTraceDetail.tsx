import { Bot, Target, FileText } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { RiskBadge } from "@rag/components/common/Badge";
import { EvaluatorFeedbackPanel } from "./EvaluatorFeedbackPanel";
import { RetrievedEvidencePanel } from "./RetrievedEvidencePanel";
import { ProcessingTimeline } from "./ProcessingTimeline";
import { LiveTraceSummary } from "./LiveTraceSummary";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

// Full detail view for a single live-lab trace. Reused by the Trace Explorer
// "Live Lab Traces" tab.
export function LiveTraceDetail({ trace }: { trace: LiveRagLabTrace }) {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{trace.question}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slatey-500">
              <FileText className="h-3 w-3" /> {trace.documentName} · {new Date(trace.createdAt).toLocaleString()}
            </p>
          </div>
          {trace.evaluation.humanReviewRequired && <RiskBadge level="High" />}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-navy-850/50 p-3">
            <p className="mb-1 flex items-center gap-1.5 stat-label"><Bot className="h-3 w-3" /> Generated answer</p>
            {trace.generatedAnswer.answer.split("\n").map((line, i) => (
              <p key={i} className={i === 0 ? "text-sm leading-relaxed text-slatey-300" : "mt-1.5 text-xs text-slatey-400"}>{line}</p>
            ))}
            <p className="mt-2 text-xs text-slatey-500">Citations: {trace.generatedAnswer.citations.join(", ") || "none"} · mode: {trace.generatedAnswer.mode}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-navy-850/50 p-3">
            <p className="mb-1 flex items-center gap-1.5 stat-label"><Target className="h-3 w-3" /> Latency & cost</p>
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-lg font-semibold text-ink">{trace.latencyMs}ms</p><p className="text-[11px] text-slatey-500">end to end</p></div>
              <div><p className="text-lg font-semibold text-ink">${trace.estimatedCost.toFixed(5)}</p><p className="text-[11px] text-slatey-500">estimated cost</p></div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <EvaluatorFeedbackPanel evaluation={trace.evaluation} />
        <RetrievedEvidencePanel chunks={trace.retrievedChunks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProcessingTimeline
          steps={trace.timeline}
          title="Trace Timeline"
          description="Each step of this RAG interaction, from query to quality gate."
        />
        <LiveTraceSummary trace={trace} />
      </div>
    </div>
  );
}
