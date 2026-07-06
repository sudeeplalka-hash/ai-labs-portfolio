"use client";

// Phase I, regulatory orientation. Maps the live initiative to an EU AI Act
// risk class and the four NIST AI RMF functions, derived deterministically from
// the same metadata the governance tier uses. Explicitly not legal advice.

import { useMemo } from "react";
import { useProgramSource, deriveRegulatoryMapping, type EuAiActClass } from "@labs/program-core";
import { Panel, SectionHeader, Badge, cn } from "@labs/design-system";
import { Scale, CheckCircle2, CircleDashed } from "lucide-react";

const classTone: Record<EuAiActClass, "rose" | "amber" | "emerald"> = {
  "High risk": "rose", "Limited risk": "amber", "Minimal risk": "emerald",
};

export function RegulatoryMap() {
  const { src, hydrated } = useProgramSource();
  const map = useMemo(() => deriveRegulatoryMapping(src), [src]);
  if (!hydrated || !src.initiative?.name) return null;

  return (
    <Panel>
      <SectionHeader eyebrow="Regulatory orientation" title="Where this initiative sits under EU AI Act & NIST AI RMF" icon={Scale}
        description="Derived from the initiative's pattern, criticality, and tier: the starting map you'd hand counsel and compliance."
        action={<Badge tone={classTone[map.euAiAct.riskClass]}>EU AI Act · {map.euAiAct.riskClass}</Badge>} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* EU AI Act */}
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">EU AI Act</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slatey-300">{map.euAiAct.rationale}</p>
          <p className="stat-label mt-3 mb-1.5">Obligations this class carries</p>
          <ul className="space-y-1">
            {map.euAiAct.obligations.map((o) => (
              <li key={o} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-slatey-400">
                <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  map.euAiAct.riskClass === "High risk" ? "bg-rose-400" : map.euAiAct.riskClass === "Limited risk" ? "bg-amber-400" : "bg-emerald-400")} />
                {o}
              </li>
            ))}
          </ul>
        </div>

        {/* NIST AI RMF */}
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">NIST AI RMF: function coverage</p>
          <div className="mt-2 space-y-2.5">
            {map.nist.map((n) => (
              <div key={n.fn}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-ink">{n.fn}</span>
                  <span className="text-[11px] text-slatey-500">{n.intent}</span>
                  {n.status === "covered"
                    ? <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> covered</span>
                    : <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><CircleDashed className="h-3 w-3" /> partial</span>}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slatey-400">{n.coveredBy.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] italic text-slatey-500">{map.disclaimer}</p>
    </Panel>
  );
}
