import { Brain, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { GateBadge } from "@rag/components/common/Badge";
import { ScoreBar } from "@rag/components/common/ScoreBar";
import { EmptyState } from "@rag/components/common/EmptyState";
import { cn } from "@rag/lib/cn";
import type { LiveEvaluationResult } from "@rag/types/liveLab";

export function EvaluatorFeedbackPanel({ evaluation }: { evaluation: LiveEvaluationResult | null }) {
  if (!evaluation) {
    return (
      <Panel className="ring-1 ring-accent/20">
        <SectionHeader title="Evaluator Feedback" description="Plain English explanation of what the evaluator did." icon={Brain} />
        <EmptyState message="Ask a question, the evaluator will explain whether the answer can be trusted." />
      </Panel>
    );
  }

  const metrics = [
    { label: "Retrieval relevance", value: evaluation.retrievalRelevance, lower: false },
    { label: "Faithfulness", value: evaluation.faithfulness, lower: false },
    { label: "Citation accuracy", value: evaluation.citationAccuracy, lower: false },
    { label: "Answer completeness", value: evaluation.answerCompleteness, lower: false },
    { label: "Hallucination risk", value: evaluation.hallucinationRisk, lower: true },
    { label: "Overall quality", value: evaluation.overallQuality, lower: false },
  ];

  return (
    <Panel className="ring-1 ring-accent/20">
      <SectionHeader title="Evaluator Feedback" description="The main product: what happened, what to trust, and what to do next." icon={Brain} />

      {/* Decision banner */}
      <div
        className={cn(
          "mb-4 flex items-center justify-between gap-3 rounded-lg border p-3",
          evaluation.qualityGateStatus === "Passed"
            ? "border-emerald-500/30 bg-emerald-500/[0.07]"
            : evaluation.qualityGateStatus === "Warning"
            ? "border-amber-500/30 bg-amber-500/[0.07]"
            : "border-rose-500/30 bg-rose-500/[0.07]",
        )}
      >
        <div className="flex items-center gap-2">
          {evaluation.qualityGateStatus === "Passed" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          ) : evaluation.qualityGateStatus === "Warning" ? (
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-700" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">Quality decision: {evaluation.qualityGateStatus}</p>
            {evaluation.humanReviewRequired && <p className="text-[11px] text-amber-700">Human review required before relying on this answer.</p>}
          </div>
        </div>
        <GateBadge status={evaluation.qualityGateStatus} />
      </div>

      {/* Score bars */}
      <div className="mb-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="mb-1 flex justify-between text-xs text-slatey-400">
              <span>{m.label}</span>
              <span className="font-medium text-slatey-300">{m.value}%</span>
            </div>
            <ScoreBar value={m.value} target={m.lower ? 20 : 80} mode={m.lower ? "lower-better" : "higher-better"} showValue={false} />
          </div>
        ))}
      </div>

      {/* Narrative */}
      <div className="space-y-2 rounded-lg border border-slate-100 bg-navy-850/40 p-3">
        {evaluation.userFriendlyExplanation.map((p, i) => (
          <p key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slatey-300">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slatey-600" />
            {p}
          </p>
        ))}
      </div>
    </Panel>
  );
}
