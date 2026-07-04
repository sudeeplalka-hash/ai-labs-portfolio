import { CheckCircle2, AlertTriangle, ShieldAlert, UserCheck } from "lucide-react";
import { cn } from "@rag/lib/cn";
import type { LiveEvaluationResult } from "@rag/types/liveLab";

const CONFIG = {
  Passed: {
    Icon: CheckCircle2,
    wrap: "border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-emerald-500/[0.06] to-transparent",
    accent: "text-emerald-700",
    ring: "ring-emerald-500/30",
    headline: "Looks trustworthy",
  },
  Warning: {
    Icon: AlertTriangle,
    wrap: "border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/[0.06] to-transparent",
    accent: "text-amber-700",
    ring: "ring-amber-500/30",
    headline: "Usable, but review it",
  },
  Failed: {
    Icon: ShieldAlert,
    wrap: "border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/[0.06] to-transparent",
    accent: "text-rose-700",
    ring: "ring-rose-500/30",
    headline: "Not reliable yet",
  },
} as const;

export function QualityVerdictBanner({
  evaluation,
  question,
}: {
  evaluation: LiveEvaluationResult;
  question?: string;
}) {
  const cfg = CONFIG[evaluation.qualityGateStatus];
  const Icon = cfg.Icon;
  const stats = [
    { label: "Faithfulness", value: evaluation.faithfulness },
    { label: "Citation accuracy", value: evaluation.citationAccuracy },
    { label: "Hallucination risk", value: evaluation.hallucinationRisk },
  ];

  return (
    <div className={cn("rounded-xl border p-4 sm:p-5 animate-fade-in", cfg.wrap)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-950/40 ring-1", cfg.ring)}>
            <Icon className={cn("h-6 w-6", cfg.accent)} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slatey-400">Quality decision</span>
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", cfg.accent, "bg-navy-950/40")}>
                {evaluation.qualityGateStatus}
              </span>
              {evaluation.humanReviewRequired && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/30">
                  <UserCheck className="h-3 w-3" /> Human review
                </span>
              )}
            </div>
            <p className="mt-1 text-base font-semibold text-ink">{cfg.headline}</p>
            {question && <p className="mt-0.5 truncate text-sm text-slatey-400">“{question}”</p>}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className={cn("text-3xl font-semibold leading-none", cfg.accent)}>{evaluation.overallQuality}%</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-slatey-500">Overall quality</p>
          </div>
          <div className="hidden gap-4 border-l border-line pl-5 sm:flex">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-semibold text-ink">{s.value}%</p>
                <p className="mt-0.5 text-[11px] text-slatey-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
