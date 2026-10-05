"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { storyNeighbors, STAGES, STAGE_MAP, useProgramSource, selectReleaseBlockers, type StageKey } from "@labs/program-core";

export function NextStageCTA({ stage }: { stage: StageKey }) {
  const { next } = storyNeighbors(stage);
  const { state, src, isDemo, hydrated } = useProgramSource();
  if (!next || !hydrated) return null;
  const n = STAGES.findIndex((item) => item.key === stage) + 1;
  const blockers = selectReleaseBlockers(src).filter((item) => item.source === stage);
  const locked = !isDemo && state.progress[next.key] === "locked";
  return <section aria-label="Next stage handoff" className="no-print mt-6 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl"><p className="text-sm text-slatey-300"><span className="font-semibold text-ink">Stage {n} of {STAGES.length}.</span> Carry the current inputs, decisions and unresolved work to {next.label}.</p><p className="mt-1 text-xs text-slatey-500">{isDemo ? 'Curated sample handoff.' : 'Current browser-program handoff.'} Exploring the next stage does not approve a deployment.</p></div>
      {locked ? <span aria-disabled="true" className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-slatey-500">{next.label} is locked</span> : <Link href={next.href} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">{blockers.length ? 'Continue with open items to' : 'Continue to'} {next.label}<ArrowRight aria-hidden className="h-4 w-4" /></Link>}
    </div>
    {locked && <p className="mt-3 text-sm text-amber-800">{STAGE_MAP[next.key].reason} Complete the required input or decision in this stage first.</p>}
    {blockers.length > 0 && <details className="mt-3 border-t border-primary/15 pt-2" open><summary className="cursor-pointer py-1 text-sm font-semibold">{blockers.length} open release item{blockers.length === 1 ? '' : 's'} owned by this stage</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slatey-300">{blockers.map(item => <li key={item.text}>{item.text}</li>)}</ul></details>}
  </section>;
}
