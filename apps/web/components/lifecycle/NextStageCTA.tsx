"use client";

// Phase A, every stage ends with a forward step, not a dead end. Reads the
// story spine so labels/ordering stay single-sourced.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { storyNeighbors, STAGES, type StageKey } from "@labs/program-core";

export function NextStageCTA({ stage }: { stage: StageKey }) {
  const { next } = storyNeighbors(stage);
  if (!next) return null;
  const n = STAGES.findIndex((s) => s.key === stage) + 1;
  return (
    <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3">
      <p className="text-sm text-slatey-300">
        <span className="font-semibold text-ink">Stage {n} of 6.</span> This stage&rsquo;s contract flows downstream. Follow it.
      </p>
      <Link href={next.href} className="group inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark">
        Continue to {next.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
