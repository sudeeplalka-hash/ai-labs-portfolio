import { ScrollText, UserCheck } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { GateBadge } from "@rag/components/common/Badge";
import { EngineBadge } from "@rag/components/common/EngineBadge";
import { EmptyState } from "@rag/components/common/EmptyState";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

export function LiveTraceSummary({ trace }: { trace: LiveRagLabTrace | null }) {
  if (!trace) {
    return (
      <Panel>
        <SectionHeader title="Trace Summary" description="The audit trail of one RAG interaction." icon={ScrollText} />
        <EmptyState message="The latest trace will appear here after you ask a question." />
      </Panel>
    );
  }

  const e = trace.evaluation;
  const rows: { label: string; value: string }[] = [
    { label: "Question", value: trace.question },
    { label: "Chunks retrieved", value: String(trace.retrievedChunks.length) },
    { label: "Answer generated", value: trace.generatedAnswer.answer ? "Yes" : "No" },
    { label: "Answer engine", value: trace.generatedAnswer.engineLabel ?? (trace.generatedAnswer.mode === "llm" ? "LLM" : "Simulated") },
    { label: "Citations generated", value: String(trace.generatedAnswer.citations.length) },
    { label: "Evaluation completed", value: "Yes" },
    { label: "Latency", value: `${trace.latencyMs}ms` },
    { label: "Estimated cost", value: `$${trace.estimatedCost.toFixed(5)}` },
  ];

  return (
    <Panel>
      <SectionHeader
        title="Trace Summary"
        description="A trace records the question, evidence, answer, citations, scores, and quality decision, the proof of why an answer was or was not trustworthy."
        icon={ScrollText}
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-navy-850/40 p-3">
        <span className="font-mono text-[11px] text-slatey-500">{trace.id}</span>
        <div className="flex items-center gap-2">
          <EngineBadge mode={trace.generatedAnswer.mode} label={trace.generatedAnswer.engineLabel} />
          {e.humanReviewRequired && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/30">
              <UserCheck className="h-3 w-3" /> Review
            </span>
          )}
          <GateBadge status={e.qualityGateStatus} />
        </div>
      </div>
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 py-1.5">
            <dt className="text-sm text-slatey-500">{r.label}</dt>
            <dd className="max-w-[65%] text-right text-sm font-medium text-slatey-300">{r.value}</dd>
          </div>
        ))}
      </dl>
      {/* TODO: future integration, write this trace into the global Query Trace
          Explorer store so live + mock traces share one inspection surface. */}
    </Panel>
  );
}
