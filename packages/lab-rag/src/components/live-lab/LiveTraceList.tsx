"use client";

import { GateBadge } from "@rag/components/common/Badge";
import { EngineBadge } from "@rag/components/common/EngineBadge";
import { UserCheck } from "lucide-react";
import { cn } from "@rag/lib/cn";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Compact, selectable list of live-lab traces. Shared by the lab history panel
// and the Query Trace Explorer "Live Lab Traces" tab.
export function LiveTraceList({
  traces,
  activeId,
  onSelect,
  className,
}: {
  traces: LiveRagLabTrace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {traces.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "w-full rounded-lg border p-2.5 text-left transition-colors",
            t.id === activeId
              ? "border-accent/40 bg-accent/10"
              : "border-slate-100 bg-navy-850/40 hover:border-line",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slatey-500">{relativeTime(t.createdAt)}</span>
            <div className="flex items-center gap-1.5">
              <EngineBadge mode={t.generatedAnswer.mode} label={t.generatedAnswer.engineLabel} size="xs" />
              {t.evaluation.humanReviewRequired && (
                <UserCheck className="h-3 w-3 text-amber-700" aria-label="Human review required" />
              )}
              <GateBadge status={t.evaluation.qualityGateStatus} />
            </div>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{t.question}</p>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slatey-500">
            <span>Quality {t.evaluation.overallQuality}%</span>
            <span>Halluc {t.evaluation.hallucinationRisk}%</span>
            <span>{t.retrievedChunks.length} chunks</span>
          </div>
        </button>
      ))}
    </div>
  );
}
