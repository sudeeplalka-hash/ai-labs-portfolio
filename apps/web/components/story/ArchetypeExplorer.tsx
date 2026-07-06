"use client";

// Phase K, the six sample programs, surfaced as an invitation instead of a
// header dropdown. Pick one and the whole storyline (and every lab) retells
// itself for that archetype. Selecting switches to Demo mode so the choice
// takes effect immediately; Live mode is one click away in the header.

import { Shuffle, Check } from "lucide-react";
import { useProgram, DEMO_ARCHETYPES, type DemoArchetype } from "@labs/program-core";
import { cn } from "@labs/design-system";

export function ArchetypeExplorer() {
  const { mode, setMode, demoArchetype, setDemoArchetype, hydrated } = useProgram();
  if (!hydrated) return null;

  const pick = (id: DemoArchetype) => {
    setDemoArchetype(id);
    if (mode !== "demo") setMode("demo");
  };

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
        <Shuffle className="h-3.5 w-3.5" /> Six sample programs
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">Shuffle the story, same loop, six very different programs</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slatey-400">
        Pick an archetype and every stage retells itself: the numbers, the risks, the governance decision, the business case.
        The <b className="text-slatey-300">at-risk</b> one shows what failure looks like.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_ARCHETYPES.map((a) => {
          const active = mode === "demo" && demoArchetype === a.id;
          return (
            <button
              key={a.id}
              onClick={() => pick(a.id)}
              aria-pressed={active}
              className={cn(
                "group flex flex-col rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-primary bg-white shadow-card ring-1 ring-inset ring-primary/30"
                  : "border-line bg-white/70 hover:border-primary/40 hover:bg-white hover:shadow-card",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={cn("text-sm font-semibold", active ? "text-primary-dark" : "text-ink")}>{a.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </span>
              <span className="mt-1 text-[12px] leading-relaxed text-slatey-400">{a.blurb}</span>
              <span className={cn("mt-2 text-[11px] font-semibold", active ? "text-primary" : "text-slatey-500 group-hover:text-primary")}>
                {active ? "Showing this program" : "Explore this program →"}
              </span>
            </button>
          );
        })}
      </div>
      {mode !== "demo" && (
        <p className="mt-3 text-[11px] text-slatey-500">Picking one switches you to Demo, your live initiative stays untouched, and the header toggle brings it back.</p>
      )}
    </div>
  );
}
