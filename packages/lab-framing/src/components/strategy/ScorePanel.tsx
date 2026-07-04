"use client";

import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge, cn } from "@labs/design-system";
import type { Scored, Band } from "../../strategy/model";

const BAND_TONE: Record<Band, { chip: string; ring: string; text: string }> = {
  go: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", ring: "#16a34a", text: "text-emerald-700" },
  refine: { chip: "bg-sky-50 text-sky-700 ring-sky-600/20", ring: "#0284c7", text: "text-sky-700" },
  redesign: { chip: "bg-amber-50 text-amber-700 ring-amber-600/20", ring: "#d97706", text: "text-amber-700" },
  stop: { chip: "bg-rose-50 text-rose-700 ring-rose-600/20", ring: "#e11d48", text: "text-rose-700" },
};
const barColor = (s: number) => (s >= 75 ? "bg-emerald-500" : s >= 60 ? "bg-sky-500" : s >= 45 ? "bg-amber-500" : "bg-rose-500");
const sev: Record<string, string> = { high: "text-rose-600", med: "text-amber-600", low: "text-slatey-400" };

export function ScorePanel({ scored }: { scored: Scored }) {
  const t = BAND_TONE[scored.band];
  const R = 34, C = 2 * Math.PI * R, off = C * (1 - scored.overall / 100);

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
      {/* headline score */}
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0">
          <circle cx="40" cy="40" r={R} fill="none" stroke="#eef2f6" strokeWidth="7" />
          <circle cx="40" cy="40" r={R} fill="none" stroke={t.ring} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 40 40)" />
          <text x="40" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill="#152433">{scored.overall}</text>
        </svg>
        <div>
          <p className="stat-label">Strategy readiness</p>
          <span className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", t.chip)}>
            {scored.recommendation}
          </span>
          <p className="mt-1 text-[11px] text-slatey-400">out of 100 · weighted across six categories</p>
        </div>
      </div>

      {/* category bars */}
      <div className="space-y-2">
        {scored.categories.map((c) => (
          <div key={c.key}>
            <div className="mb-0.5 flex items-center justify-between text-[11px]">
              <span className="text-slatey-400">{c.label} <span className="text-slatey-500">·{Math.round(c.weight * 100)}%</span></span>
              <span className="font-mono font-semibold text-ink">{c.score}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", barColor(c.score))} style={{ width: `${c.score}%` }} /></div>
          </div>
        ))}
      </div>

      {/* required gates */}
      <div className="rounded-lg border border-line bg-slate-50/60 p-3">
        <p className="stat-label mb-2">Required gates</p>
        <ul className="space-y-1.5">
          {scored.gates.map((g) => (
            <li key={g.key} className="flex items-center gap-2 text-xs">
              {g.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-400" />}
              <span className={g.passed ? "text-slatey-300" : "text-slatey-400"}>{g.label}</span>
            </li>
          ))}
        </ul>
        {!scored.gatesPassed && (
          <p className="mt-2 flex items-start gap-1.5 rounded-md bg-rose-50 p-2 text-[11px] leading-relaxed text-rose-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Not ready for Data Lab yet. Resolve required gates before proceeding.
          </p>
        )}
      </div>

      {/* top risks */}
      {scored.risks.length > 0 && (
        <div>
          <p className="stat-label mb-1.5">Top risks</p>
          <ul className="space-y-1">
            {scored.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slatey-400">
                <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", sev[r.severity] ? "" : "", r.severity === "high" ? "bg-rose-500" : r.severity === "med" ? "bg-amber-500" : "bg-slate-400")} />
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* next action */}
      <div className="rounded-lg border border-primary/20 bg-primary-soft/50 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark"><ArrowRight className="h-3 w-3" /> Suggested next action</p>
        <p className="mt-1 text-xs leading-relaxed text-slatey-300">{scored.nextAction}</p>
      </div>
    </div>
  );
}
