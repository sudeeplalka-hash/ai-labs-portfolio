import { FileSearch, Check, X } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { EmptyState } from "@rag/components/common/EmptyState";
import { cn } from "@rag/lib/cn";
import type { RetrievedLiveChunk } from "@rag/types/liveLab";

export function RetrievedEvidencePanel({ chunks }: { chunks: RetrievedLiveChunk[] }) {
  return (
    <Panel>
      <SectionHeader
        title="Retrieved Evidence"
        description="The passages the retriever found before generating the answer. Weak retrieval leads to incomplete answers or hallucinations."
        icon={FileSearch}
      />
      {chunks.length === 0 ? (
        <EmptyState message="Ask a question to see the evidence the retriever selected." />
      ) : (
        <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
          {chunks.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-lg border p-3",
                c.usedInAnswer ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-line bg-navy-850/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-7 items-center justify-center rounded-md bg-accent/15 text-[11px] font-bold text-accent-cyan">
                    {c.citationLabel}
                  </span>
                  <span className="text-xs text-slatey-400">
                    {c.metadata.source}
                    {c.heading ? ` · ${c.heading}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ink">{c.relevanceScore.toFixed(2)}</span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slatey-300">{c.text}</p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {c.matchReasons.map((r, i) => (
                  <span key={i} className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-slatey-300">{r}</span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px]">
                <span className={cn("inline-flex items-center gap-1", c.usedInAnswer ? "text-emerald-700" : "text-slatey-500")}>
                  {c.usedInAnswer ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Used in answer
                </span>
                <span className="font-mono text-slatey-600">{c.id} · rank {c.rank}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
