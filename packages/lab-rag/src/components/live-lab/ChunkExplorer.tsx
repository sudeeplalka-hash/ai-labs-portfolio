"use client";

import { useState } from "react";
import { Boxes } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { EmptyState } from "@rag/components/common/EmptyState";
import { cn } from "@rag/lib/cn";
import type { DocumentChunk, RetrievedLiveChunk } from "@rag/types/liveLab";

type Filter = "all" | "retrieved" | "cited" | "unused";

export function ChunkExplorer({
  chunks,
  retrieved,
}: {
  chunks: DocumentChunk[];
  retrieved: RetrievedLiveChunk[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const retrievedMap = new Map(retrieved.map((r) => [r.id, r]));
  const citedIds = new Set(retrieved.filter((r) => r.usedInAnswer).map((r) => r.id));

  const filtered = chunks.filter((c) => {
    if (filter === "retrieved") return retrievedMap.has(c.id);
    if (filter === "cited") return citedIds.has(c.id);
    if (filter === "unused") return !retrievedMap.has(c.id);
    return true;
  });

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All chunks", count: chunks.length },
    { id: "retrieved", label: "Retrieved", count: retrieved.length },
    { id: "cited", label: "Cited", count: citedIds.size },
    { id: "unused", label: "Unused", count: chunks.length - retrievedMap.size },
  ];

  return (
    <Panel>
      <SectionHeader
        title="Chunk Explorer"
        description="RAG retrieves small passages, not whole documents. This shows how the document was split and which chunks were used."
        icon={Boxes}
      />
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-line bg-navy-900/60 p-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
              filter === f.id ? "bg-primary/10 text-primary ring-1 ring-inset ring-accent/30" : "text-slatey-400 hover:text-ink",
            )}
          >
            {f.label} <span className="text-slatey-500">({f.count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No chunks match this filter yet." />
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {filtered.map((c) => {
            const r = retrievedMap.get(c.id);
            const cited = citedIds.has(c.id);
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-lg border p-3",
                  cited
                    ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                    : r
                    ? "border-accent/30 bg-accent/[0.05]"
                    : "border-line bg-navy-850/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slatey-400">{c.id}</span>
                  <div className="flex items-center gap-1.5">
                    {r && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent-cyan">retrieved · {r.relevanceScore.toFixed(2)}</span>}
                    {cited && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-700">cited {r?.citationLabel}</span>}
                  </div>
                </div>
                {c.heading && <p className="mt-1 text-sm font-semibold text-slatey-300">{c.heading}</p>}
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slatey-400">{c.text}</p>
                <p className="mt-1.5 text-xs text-slatey-600">{c.characterCount} chars · ~{c.estimatedTokens} tokens</p>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
