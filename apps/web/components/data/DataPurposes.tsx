"use client";

// Phase 6, Data Purpose Readiness. Not all data is RAG corpus data: each asset
// has a different downstream use (eval, golden test, fine tuning, training,
// telemetry, outcomes, tool logs). Deterministic, read-only.
//
// Phase F, heat-strip presentation: one glance answers "what's blocking which
// downstream use". Click a cell for the why; the table is gone.

import { useMemo, useState } from "react";
import { useProgramSource, deriveDataPurposes } from "@labs/program-core";
import { Panel, SectionHeader, Badge, cn } from "@labs/design-system";
import { Layers } from "lucide-react";

const CELL: Record<string, string> = {
  "ready": "bg-emerald-500/80 ring-emerald-600/30",
  "ready-with-cautions": "bg-amber-400/80 ring-amber-600/30",
  "not-required": "bg-slate-200 ring-slate-400/30",
};
const cellCls = (s: string) => CELL[s] ?? "bg-rose-400/80 ring-rose-600/30";
const stTone = (s: string): "emerald" | "amber" | "rose" | "slate" =>
  s === "ready" ? "emerald" : s === "ready-with-cautions" ? "amber" : s === "not-required" ? "slate" : "rose";

export function DataPurposes() {
  const { src, hydrated } = useProgramSource();
  const rows = useMemo(() => deriveDataPurposes(src), [src]);
  const [selected, setSelected] = useState<string | null>(null);
  if (!hydrated) return null;

  const active = rows.find((r) => r.purpose === selected) ?? null;

  return (
    <Panel>
      <SectionHeader eyebrow="Data purpose readiness" title="Every data asset has a different downstream use" icon={Layers}
        description="AI readiness isn't one score, RAG corpus, evaluation sets, training data, telemetry, and outcome data each serve a different stage. Click a cell for the why." />

      <div className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <button
            key={r.purpose}
            onClick={() => setSelected(selected === r.purpose ? null : r.purpose)}
            aria-pressed={selected === r.purpose}
            title={`${r.purpose}: ${r.status}`}
            className={cn(
              "flex min-w-[128px] flex-1 flex-col items-start gap-1 rounded-lg p-2.5 text-left ring-1 ring-inset transition-transform",
              cellCls(r.status),
              selected === r.purpose ? "scale-[1.02] shadow-card" : "hover:scale-[1.01]",
            )}
          >
            <span className={cn("text-xs font-semibold", r.status === "not-required" ? "text-slate-600" : "text-white")}>{r.purpose}</span>
            <span className={cn("text-[10px] font-medium uppercase tracking-wide", r.status === "not-required" ? "text-slate-500" : "text-white/85")}>
              {r.status}{r.required ? " · required" : ""}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-3 flex flex-wrap items-start justify-between gap-2 rounded-lg border border-line bg-slate-50/60 p-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{active.purpose}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slatey-400">{active.why}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {active.required ? <Badge tone="blue">Required</Badge> : <Badge tone="slate">Not required</Badge>}
            <Badge tone={stTone(active.status)}>{active.status}</Badge>
          </div>
        </div>
      )}
    </Panel>
  );
}
