"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, ArrowRight } from "lucide-react";
import {
  useProgramSource, STORY_SPINE, STORY_MAP,
  type StoryTone,
} from "@labs/program-core";

const CHIP: Record<StoryTone, string> = {
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  watch: "bg-amber-50 text-amber-700 ring-amber-600/20",
  risk: "bg-rose-50 text-rose-700 ring-rose-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-400/20",
};

function verdict(roi: number | null, done: boolean): { label: string; tone: StoryTone } {
  if (!done || roi === null) return { label: "Pending, case not yet complete", tone: "neutral" };
  if (roi > 50) return { label: "Recommended to fund", tone: "healthy" };
  if (roi > 0) return { label: "Proceed with conditions", tone: "watch" };
  return { label: "Not yet fundable", tone: "risk" };
}

export function BoardBrief() {
  const { src, isDemo, hydrated } = useProgramSource();
  const [printedOn, setPrintedOn] = useState("");
  useEffect(() => { setPrintedOn(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })); }, []);

  if (!hydrated) return null;
  const i = src.initiative;
  const realize = STORY_MAP.realize;
  const roi = typeof src.outcomes?.roi === "number" ? src.outcomes.roi : null;
  const v = verdict(roi, realize.isDone(src));
  const realizeHeads = realize.read(src);

  return (
    <div className="mx-auto max-w-3xl">
      {/* actions, never printed */}
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link href="/story" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to the story
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      {/* the one-pager */}
      <article className="rounded-2xl border border-line bg-white p-8 shadow-card print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-line pb-4">
          <p className="eyebrow">AI Initiative · Board Brief</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{i?.name ?? "Untitled initiative"}</h2>
          {(i?.sharpenedProblem || i?.valueHypothesis) && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slatey-400">{i?.valueHypothesis ?? i?.sharpenedProblem}</p>
          )}
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${CHIP[v.tone]}`}>
            {v.label}
          </span>
        </header>

        {/* Bottom line up front */}
        <section className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.05] p-4">
          <p className="eyebrow text-primary-dark">Bottom line</p>
          <p className="mt-1 text-lg font-semibold leading-snug text-ink">{realize.soWhat(src)}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {realizeHeads.map((h) => (
              <span key={h.label} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium ring-1 ring-inset ${CHIP[h.tone]}`}>
                <span className="text-slatey-500">{h.label}</span><span className="font-semibold">{h.value}</span>
              </span>
            ))}
          </div>
        </section>

        {/* The traceable path */}
        <section className="mt-6">
          <p className="stat-label mb-3">How we got there, every figure traces to a stage</p>
          <ol className="divide-y divide-line">
            {STORY_SPINE.map((b) => {
              const heads = b.read(src);
              return (
                <li key={b.key} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex shrink-0 items-center gap-2 sm:w-40">
                    <span className="font-mono text-[11px] text-slatey-500">{b.n}</span>
                    <span className="text-sm font-semibold text-ink">{b.label}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-slatey-300">{b.soWhat(src)}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {heads.map((h) => (
                        <span key={h.label} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${CHIP[h.tone]}`}>
                          <span className="text-slatey-500">{h.label}</span><span className="font-semibold">{h.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <footer className="mt-6 border-t border-line pt-3 text-[11px] leading-relaxed text-slatey-400">
          Generated from the AI Program Command Center{printedOn ? ` · ${printedOn}` : ""}{isDemo ? " · demo data" : ""}.
          Figures are illustrative of the method; each is produced by its stage and carried forward, nothing is hand-waved.
        </footer>
      </article>

      <div className="no-print mt-4 text-center">
        <Link href="/realize" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark">
          Open Realize to interrogate the numbers <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
