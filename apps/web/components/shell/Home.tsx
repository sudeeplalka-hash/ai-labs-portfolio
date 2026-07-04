"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Compass, Database, Boxes, Rocket, ShieldCheck, TrendingUp, ArrowRight, Workflow, MousePointerClick, BookOpen, type LucideIcon,
} from "lucide-react";
import { Badge } from "@labs/design-system";
import { STAGES, useProgram, selectStageHeadlines, type StageKey, type StageHeadline } from "@labs/program-core";
import { StartHereLoop, ReviewerModes, WhatThisDemonstrates, ContractLoop, ReviewerLinks } from "@/components/reviewer/Reviewer";
import { LoadSampleButton } from "@/components/reviewer/SampleProgram";
import { Welcome } from "@/components/shell/Welcome";

const ICONS: Record<StageKey, LucideIcon> = {
  frame: Compass, data: Database, build: Boxes, deploy: Rocket, govern: ShieldCheck, realize: TrendingUp,
};

// Compose each stage headline into a one-line "now:" reading for the loop cards.
function liveLines(hs: StageHeadline[]): Partial<Record<string, string>> {
  const m: Partial<Record<string, string>> = {};
  for (const h of hs) {
    if (!h.value) continue;
    m[h.key] =
      h.key === "frame" ? `${h.detail ?? "initiative framed"} · readiness ${h.value}` :
      h.key === "data" ? `readiness ${h.value}/100${h.detail?.includes("blocked") ? ` · ${h.detail}` : ""}` :
      h.key === "build" ? `quality ${h.value}/100${h.detail?.includes("gate") ? ` · ${h.detail}` : ""}` :
      h.key === "deploy" ? `release ${h.value}/100${h.detail ? ` · ${h.detail}` : ""}` :
      h.key === "govern" ? `${h.value}${h.detail ? ` · ${h.detail}` : ""}` :
      `ROI ${h.value}${h.detail ? ` · ${h.detail}` : ""}`;
  }
  return m;
}

export function Home() {
  const { state, hydrated } = useProgram();
  const framed = state.progress.frame === "done" && state.initiative.name;
  const live = useMemo(() => (hydrated ? liveLines(selectStageHeadlines(state)) : {}), [hydrated, state]);

  return (
    <div className="space-y-8">
      {/* First visit only: three doors in, then never again */}
      <Welcome />

      {/* Thesis */}
      <div className="max-w-3xl">
        <p className="eyebrow">AI Program Command Center</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Everyone has an AI idea. The hard part is <span className="text-primary">making it real</span>.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slatey-300">
          Most enterprise AI stalls right after the demo, when the real questions show up. Can the data actually feed
          it? Do the answers hold up? Will it run without blowing the budget? Is it safe enough to trust? And does it
          ever pay for itself? This walks one real initiative through all of it, from a rough idea to a business case
          you could defend in a board meeting. Take it from the top and go end to end, or jump into any lab and explore
          on your own.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LoadSampleButton label="See it working — load the sample program" />
          <Link href="/story" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">
            <BookOpen className="h-4 w-4" /> Short on time? Read the 2-minute story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Start here — the program loop */}
      <StartHereLoop />

      {/* Two ways to use it */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/frame" className="group rounded-xl border border-primary/30 bg-primary/[0.05] p-5 shadow-card transition-shadow hover:shadow-cardhover">
          <div className="flex items-center gap-2 text-primary"><Workflow className="h-5 w-5" /><span className="text-[11px] font-semibold uppercase tracking-wider">Guided</span></div>
          <h2 className="mt-2 text-lg font-semibold text-ink">Walk the program end-to-end</h2>
          <p className="mt-1 text-sm leading-relaxed text-slatey-400">
            Start at Framing, build one bet, and carry it through Data → Build → AI Ops → Govern → Realize. Every
            number in the final business case traces back to a decision you made.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {framed ? "Continue your initiative" : "Start with Framing"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="rounded-xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 text-slatey-300"><MousePointerClick className="h-5 w-5" /><span className="text-[11px] font-semibold uppercase tracking-wider">Explore</span></div>
          <h2 className="mt-2 text-lg font-semibold text-ink">Jump into any lab</h2>
          <p className="mt-1 text-sm leading-relaxed text-slatey-400">
            Each lab works on its own, just like a standalone tool — open any one below or from the sidebar. They
            get richer if you&apos;ve run the upstream stages, but none of them require it.
          </p>
        </div>
      </div>

      {/* Lab cards */}
      <div>
        <p className="stat-label mb-3">The six stages</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((s) => {
            const Icon = ICONS[s.key];
            const status = state.progress[s.key];
            return (
              <div key={s.key} className="group flex flex-col rounded-xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-cardhover">
                <Link href={s.href} className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"><Icon className="h-5 w-5" /></span>
                    <span className="font-mono text-[11px] text-slatey-500">{s.n}</span>
                    {status === "done" && <Badge tone="emerald">done</Badge>}
                  </div>
                  <h3 className="mt-2.5 text-base font-semibold text-ink">{s.label}</h3>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-slatey-500">{s.sub}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slatey-400">{s.question}</p>
                </Link>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link href={s.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">
                    Open lab <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link href={`${s.href}/guide`} className="inline-flex items-center gap-1 text-xs font-medium text-slatey-400 hover:text-primary">
                    <BookOpen className="h-3.5 w-3.5" /> Guide
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contract-driven loop — shows live values once a program is loaded */}
      <ContractLoop live={live} />

      {/* What this project demonstrates */}
      <WhatThisDemonstrates />

      {/* Reviewer paths */}
      <ReviewerModes />

      {/* Quick links */}
      <ReviewerLinks />
    </div>
  );
}
