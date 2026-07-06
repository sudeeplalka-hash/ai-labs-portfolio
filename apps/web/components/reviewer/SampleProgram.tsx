"use client";

// Phase A, one-click sample program. Loads the curated demo initiative into
// LIVE state so every stage, contract card, and downstream engine populates
// immediately, the fastest way for a first-time visitor to see the loop work.
// A visible chip marks seeded state and offers a one-click reset.

import { useState } from "react";
import { PlayCircle, RotateCcw, Sparkles } from "lucide-react";
import { useProgram, demoState } from "@labs/program-core";
import { cn } from "@labs/design-system";

export function useSampleProgram() {
  const { state, update, reset, hydrated, demoArchetype } = useProgram();
  const seeded = !!state.seededSample;
  const hasOwnWork = !seeded && !!state.initiative?.name;
  const load = () => {
    update((d) => {
      // Replace wholesale: clear every existing slice first so leftovers from a
      // previous program (e.g. an old iteration or handoff) can't leak into the
      // freshly loaded sample.
      for (const k of Object.keys(d)) delete (d as unknown as Record<string, unknown>)[k];
      Object.assign(d, demoState(demoArchetype));
      d.seededSample = true;
    });
  };
  return { hydrated, seeded, hasOwnWork, load, reset };
}

/** Primary call-to-action. `subtle` renders the bordered secondary style. */
export function LoadSampleButton({ subtle = false, className, label }: { subtle?: boolean; className?: string; label?: string }) {
  const { hydrated, seeded, hasOwnWork, load, reset } = useSampleProgram();
  const [confirming, setConfirming] = useState(false);
  if (!hydrated) return null;

  if (seeded) {
    return (
      <span className={cn("inline-flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800", className)}>
        <Sparkles className="h-4 w-4" /> Sample program loaded
        <button onClick={reset} className="inline-flex items-center gap-1 rounded-md border border-emerald-600/25 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50" title="Clear the sample and start fresh">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </span>
    );
  }

  // Don't silently overwrite a visitor's own framed initiative.
  if (hasOwnWork && !confirming) {
    return (
      <button onClick={() => setConfirming(true)}
        className={cn("inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-slatey-300 hover:bg-slate-50", className)}>
        <PlayCircle className="h-4 w-4" /> {label ?? "Load the sample program"}
      </button>
    );
  }
  if (hasOwnWork && confirming) {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-2 text-sm", className)}>
        <span className="text-slatey-400">Replace your current initiative with the sample?</span>
        <button onClick={load} className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-dark">Replace</button>
        <button onClick={() => setConfirming(false)} className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-slatey-300 hover:bg-slate-50">Keep mine</button>
      </span>
    );
  }

  return (
    <button onClick={load}
      className={cn(
        subtle
          ? "inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-slatey-300 hover:bg-slate-50"
          : "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark",
        className,
      )}>
      <PlayCircle className="h-4 w-4" /> {label ?? "Load the sample program"}
    </button>
  );
}

/** Compact inline link used inside ghost/empty states. */
export function LoadSampleInline({ className }: { className?: string }) {
  const { hydrated, seeded, load } = useSampleProgram();
  if (!hydrated || seeded) return null;
  return (
    <button onClick={load} className={cn("inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark", className)}>
      <PlayCircle className="h-3.5 w-3.5" /> Load the sample program
    </button>
  );
}
