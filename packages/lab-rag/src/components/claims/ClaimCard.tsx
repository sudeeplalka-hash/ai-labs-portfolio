import { Quote, FileCheck2, MessageSquareWarning } from "lucide-react";
import { SupportBadge } from "@rag/components/common/Badge";
import { cn } from "@rag/lib/cn";
import type { ClaimVerification } from "@rag/types";

export function ClaimCard({ claim }: { claim: ClaimVerification }) {
  const danger = claim.supportStatus === "Unsupported" || claim.supportStatus === "Contradicted";
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        danger ? "border-rose-500/30 bg-rose-500/[0.06]" : "border-line bg-navy-850/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-start gap-2 text-sm font-medium text-ink">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-slatey-500" />
          {claim.claim}
        </p>
        <SupportBadge status={claim.supportStatus} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slatey-400">
        <span>
          Confidence <span className="font-semibold text-slatey-300">{Math.round(claim.confidence * 100)}%</span>
        </span>
        {claim.sourceDocument && <span>Source: {claim.sourceDocument}</span>}
        {claim.citationId && (
          <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-slatey-300">{claim.citationId}</span>
        )}
      </div>

      {claim.evidenceSnippet && (
        <div className="mt-3 flex items-start gap-2 rounded-md border-l-2 border-accent/40 bg-navy-900/60 px-3 py-2 text-xs leading-relaxed text-slatey-300">
          <FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-cyan" />
          <span>{claim.evidenceSnippet}</span>
        </div>
      )}

      {claim.reviewerNote && (
        <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-amber-700/90">
          <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{claim.reviewerNote}</span>
        </div>
      )}
    </div>
  );
}
