"use client";

import { useMemo, useState } from "react";
import { Wand2, ArrowRight, Check } from "lucide-react";
import { Badge, cn } from "@labs/design-system";
import { generateBacklog } from "../../engine/backlog";
import { curatedReframe } from "../../engine/reframe";
import { PARAM_DEFS, BUCKETS } from "../../engine/params";
import type { FramingParams, UseCase } from "../../engine/types";
import { BacklogScatter } from "../Scatter";

const DEFAULT_AMBITION = "Use AI to improve customer support.";
const DEFAULT_PARAMS: FramingParams = { user: "Customers", job: "Answer", pain: "Too slow", posture: "Scattered", risk: "Balanced" };

// Idea generator: from a vague ambition + five knobs, generate a sharpened
// framing and a scored spread of candidate use-cases. Picking one seeds the
// structured workshop below. Fully deterministic — no model calls.
export function IdeaGenerator({ onUse }: { onUse: (uc: UseCase, params: FramingParams, ambition: string, sharpened: string) => void }) {
  const [ambition, setAmbition] = useState(DEFAULT_AMBITION);
  const [params, setParams] = useState<FramingParams>(DEFAULT_PARAMS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const backlog = useMemo(() => generateBacklog(params, ambition), [params, ambition]);
  const sharpened = useMemo(() => curatedReframe({ rawAmbition: ambition, params }).sharpenedProblem, [ambition, params]);
  const topPick = useMemo(() => backlog.reduce((b, u) => (u.value / u.effort > b.value / b.effort ? u : b), backlog[0]), [backlog]);
  const selected = (selectedId != null ? backlog.find((u) => u.id === selectedId) : null) ?? topPick;

  const setParam = (key: string, value: string) => setParams((p) => ({ ...p, [key]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* inputs */}
      <div className="space-y-4">
        <div>
          <label htmlFor="gen-ambition" className="stat-label mb-1 block">What do you wish AI could do?</label>
          <textarea id="gen-ambition" rows={2} value={ambition} onChange={(e) => setAmbition(e.target.value)}
            placeholder="Say it plainly — a rough, vague ambition is fine."
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slatey-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {PARAM_DEFS.map((def) => (
            <div key={def.key}>
              <p className="stat-label mb-2">{def.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {def.opts.map((o) => {
                  const active = params[def.key as keyof FramingParams] === o;
                  return (
                    <button key={o} type="button" onClick={() => setParam(def.key, o)} aria-pressed={active}
                      className={cn("rounded-md border px-2 py-1 text-[11px] transition-colors", active ? "border-ink bg-ink text-white" : "border-line bg-white text-slatey-300 hover:border-slatey-500 hover:text-ink")}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="truncate text-[11px] leading-relaxed text-slatey-500">Change any knob to reshape the options in real time.</p>

        {selected && (
          <div className="rounded-lg border border-line bg-slate-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">Your bet</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: BUCKETS[selected.bucket].soft, color: BUCKETS[selected.bucket].text }}>{selected.bucket}</span>
              <span className="text-sm font-semibold text-ink">{selected.title}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slatey-400">{selected.desc}</p>
            <div className="mt-2 flex gap-4 text-[11px] text-slatey-400">
              <span>value <b className="text-ink">{selected.value}</b></span>
              <span>effort <b className="text-ink">{selected.effort}</b></span>
            </div>
            <button onClick={() => onUse(selected, params, ambition, sharpened)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark">
              <Check className="h-4 w-4" /> Use this idea <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* right: framing + generated options */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-primary/25 bg-gradient-to-b from-[#fbfdff] to-[#f4f9ff] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark">Sharpened framing</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{sharpened}</p>
        </div>

        <div className="flex flex-1 flex-col rounded-lg border border-line bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="eyebrow" style={{ color: "#7c8a9a" }}>Generated options · value vs effort</p>
            <Badge tone="blue">Generated</Badge>
          </div>
          <BacklogScatter items={backlog} selectedId={selected?.id} onSelect={(uc) => setSelectedId(uc.id)} />
          <div className="mt-auto flex flex-wrap justify-start gap-3 pt-2 text-[11px] text-slatey-400">
            {Object.entries(BUCKETS).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: v.color }} /> {k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
