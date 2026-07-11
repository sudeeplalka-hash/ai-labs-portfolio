"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Flag, CheckCircle2 } from "lucide-react";
import { useProgramSource, STORY_MAP, storyNeighbors, type StageKey } from "@labs/program-core";

// R2.1 · The story thread, folded into the stage header. Replaces the old
// StoryThread band that stacked a THIRD header (stage number + question +
// narrative) above every page. This slim strip carries only what the header
// doesn't already say: the live metric line (soWhat) and the in ← / out →
// orientation. Mount it directly under a stage's PageIntro; one header per
// page, the question asked once.
export function StageThread({ stage }: { stage: StageKey }) {
  const { src, hydrated } = useProgramSource();
  if (!hydrated) return null;
  const beat = STORY_MAP[stage];
  if (!beat) return null;
  const { prev, next } = storyNeighbors(stage);

  return (
    <div className="-mt-3 mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-line/70 pb-2.5">
      <p className="min-w-0 text-[12px] leading-relaxed text-slatey-400">{beat.soWhat(src)}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slatey-400">
        {prev ? (
          <Link href={prev.href} className="inline-flex items-center gap-1 hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> in: {prev.label}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" /> starts the program</span>
        )}
        <span className="text-slatey-300">·</span>
        {next ? (
          <Link href={next.href} className="inline-flex items-center gap-1 hover:text-primary">
            out: {next.label} <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> ends in the business case</span>
        )}
        <Link href="/story" className="ml-1 hidden text-slatey-300 underline-offset-2 hover:text-primary hover:underline sm:inline">· the full story</Link>
      </div>
    </div>
  );
}
