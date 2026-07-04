"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Flag, CheckCircle2 } from "lucide-react";
import {
  useProgramSource, STORY_MAP, storyNeighbors,
  type StageKey,
} from "@labs/program-core";

// The connective tissue: where this lab sits in the one story. One unified view:
// a narrated band (question + so-what) with the orientation thread beneath it.
// Strategy & Framing keeps the slim strip — its own hero already tells the story.
export function StoryThread({ stage }: { stage: StageKey }) {
  const { src, hydrated } = useProgramSource();
  if (!hydrated) return null;
  const beat = STORY_MAP[stage];
  if (!beat) return null;
  const { prev, next } = storyNeighbors(stage);

  const thread = (
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
  );

  // Strategy & Framing: minimal orientation strip (its hero carries the narrative).
  if (stage === "frame") {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-line bg-slate-50/60 px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slatey-400">{beat.n} · {beat.label}</span>
        <div className="flex items-center gap-4">{thread}</div>
      </div>
    );
  }

  // Narrated band: the stage's question and why it matters, plus orientation.
  return (
    <div className="mb-5 rounded-xl border border-line bg-gradient-to-br from-slate-50 to-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-400">{beat.n} · {beat.label}</p>
      <h2 className="mt-0.5 text-base font-semibold text-ink">{beat.question}</h2>
      <p className="mt-1 text-sm leading-relaxed text-slatey-400">{beat.soWhat(src)}</p>
      <div className="mt-3 border-t border-line/70 pt-2.5">{thread}</div>
    </div>
  );
}
