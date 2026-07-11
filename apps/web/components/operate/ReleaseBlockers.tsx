"use client";

// Phase B, "What is blocking release?" The one answer aggregated from four
// pages of evidence: Data exclusions, Build gate failures, Operate readiness
// blockers, and Critical/High governance findings. Each row links to the stage
// that owns the fix.

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { useProgramSource, selectReleaseBlockers, STAGE_MAP } from "@labs/program-core";

export function ReleaseBlockers() {
  const { src, hydrated } = useProgramSource();
  const blockers = useMemo(() => selectReleaseBlockers(src), [src]);
  if (!hydrated || !src.initiative?.name) return null;

  if (blockers.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-600/25 bg-emerald-50/60 px-4 py-2.5 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span><b>No release blockers.</b> Every gate, readiness check, and critical finding currently passes.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" /> What is blocking release? · {blockers.length}
      </p>
      <ul className="mt-2 space-y-1.5">
        {blockers.map((b, i) => {
          const stage = STAGE_MAP[b.source];
          return (
            <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-sm">
              <span className="text-slatey-300">{b.text}</span>
              <Link href={stage.href} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-amber-800 underline-offset-2 hover:underline">
                fix in {stage.short} <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
