"use client";

import { useEffect, useState } from "react";
import { Database, Boxes, X, type LucideIcon } from "lucide-react";
import { readHandoff, type FramingHandoff as HandoffData } from "@rag/lib/handoff";

const STAGE: Record<"data" | "build", { icon: LucideIcon; callback: (h: HandoffData) => string }> = {
  data: {
    icon: Database,
    callback: (h) =>
      `Framing guessed Data readiness ${h.scores.dataReadiness}/100 from a self-rated "${h.posture ?? "unknown"}" posture. ` +
      `Profile your sources below — this stage confirms or punctures that guess.`,
  },
  build: {
    icon: Boxes,
    callback: (h) =>
      `In Framing this bet scored Value ${h.scores.value}/100 and Feasibility ${h.scores.feasibility}/100. ` +
      `Feasibility was a guess — the evaluator below is the real test of whether the engine works.`,
  },
};

// Surfaces the initiative carried over from the Strategy & Framing lab and the
// cross-stage callback. Renders nothing until a bet has been locked upstream.
export function FramingHandoff({ stage }: { stage: "data" | "build" }) {
  const [h, setH] = useState<HandoffData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { setH(readHandoff()); }, []);
  if (!h || dismissed) return null;

  const cfg = STAGE[stage];
  const Icon = cfg.icon;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-4 animate-fade-in">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Carried over from Framing</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{h.name}</p>
        {h.sharpenedProblem && <p className="mt-0.5 text-xs leading-relaxed text-slatey-400">{h.sharpenedProblem}</p>}
        <p className="mt-2 text-sm leading-relaxed text-slatey-300">{cfg.callback(h)}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slatey-400">
          <span>Value <b className="text-ink">{h.scores.value}</b></span>
          <span>Feasibility <b className="text-ink">{h.scores.feasibility}</b></span>
          <span>Data readiness <b className="text-ink">{h.scores.dataReadiness}</b></span>
          <span>scope <b className="text-ink">{Math.round(h.scope * 100)}%</b></span>
          {h.risk && <span>risk <b className="text-ink">{h.risk}</b></span>}
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 rounded-md p-1 text-slatey-500 hover:bg-slate-100" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
