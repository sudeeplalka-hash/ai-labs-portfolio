"use client";

import { useState } from "react";
import { ChevronDown, FileText, Check, X } from "lucide-react";
import { FreshnessBadge } from "@rag/components/common/Badge";
import { cn } from "@rag/lib/cn";
import type { RetrievedChunk } from "@rag/types";

export function RetrievedChunkCard({ chunk }: { chunk: RetrievedChunk }) {
  const [open, setOpen] = useState(chunk.rank <= 2);
  return (
    <div className="rounded-lg border border-line bg-navy-850/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-[11px] font-semibold text-slatey-300">
          {chunk.rank}
        </span>
        <FileText className="h-4 w-4 shrink-0 text-slatey-500" />
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          {chunk.sourceDocument} <span className="text-slatey-500">{chunk.documentVersion}</span>
        </span>
        <span className="hidden shrink-0 font-mono text-[11px] text-slatey-400 sm:inline">{chunk.chunkId}</span>
        <span className="shrink-0 text-xs text-slatey-300">{chunk.relevanceScore.toFixed(2)}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slatey-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-3">
          <p className="text-xs leading-relaxed text-slatey-300">{chunk.text}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5", chunk.usedInAnswer ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-400")}>
              {chunk.usedInAnswer ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Used in answer
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5", chunk.citationMatched ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700")}>
              {chunk.citationMatched ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} Citation matched
            </span>
            <FreshnessBadge status={chunk.freshnessStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
