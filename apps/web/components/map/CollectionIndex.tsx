// "The collection": the landing's browse section, an accordion by domain that
// expands to a numbered executive index of that domain's artifacts, each row
// showing the decision it enables and a LIVE/SIMULATED pill. Replaces the old
// summary cards + poster shelves so every artifact appears exactly once. Static:
// native <details> means it works with no client JS. All data from the registry.

import Link from "next/link";
import {
  Workflow, Boxes, LineChart, Users, ChevronRight, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { labById, labsByCollection, type LabEntry, type Collection as Col } from "@labs/kit";

type Accent = { chip: string; text: string; num: string };
const ACCENT: Record<string, Accent> = {
  blue: { chip: "bg-primary-soft", text: "text-primary", num: "text-primary" },
  teal: { chip: "bg-teal-50", text: "text-teal-700", num: "text-teal-600" },
  amber: { chip: "bg-amber-50", text: "text-amber-700", num: "text-amber-600" },
  violet: { chip: "bg-violet-50", text: "text-violet-700", num: "text-violet-600" },
};

type DomainDef = { c: Col; title: string; tag: string; accent: keyof typeof ACCENT; icon: LucideIcon };
const DOMAINS: DomainDef[] = [
  { c: 1, title: "Enterprise AI Lifecycle", tag: "the working program spine", accent: "blue", icon: Workflow },
  { c: 2, title: "Agent Architecture & Protocols", tag: "integration decision models", accent: "teal", icon: Boxes },
  { c: 3, title: "AI Investment & Economics", tag: "capital, cost, ROI", accent: "amber", icon: LineChart },
  { c: 4, title: "Operating Model & Adoption", tag: "governance, readiness, alignment", accent: "violet", icon: Users },
];

// Collection 1 prepends the LIVE spine (C1); the others read straight from the registry.
const labsFor = (c: Col): LabEntry[] =>
  c === 1 ? ([labById("C1"), ...labsByCollection(1)].filter(Boolean) as LabEntry[]) : labsByCollection(c);

function StatusPill({ live }: { live: LabEntry["live"] }) {
  if (live === "LIVE") return <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-700">Live</span>;
  if (live === "SIMULATED") return <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-amber-700">Simulated</span>;
  return null;
}

function DomainSection({ def, defaultOpen }: { def: DomainDef; defaultOpen?: boolean }) {
  const a = ACCENT[def.accent];
  const Icon = def.icon;
  const labs = labsFor(def.c);
  return (
    <details open={defaultOpen} className="group overflow-hidden rounded-xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${a.chip}`}><Icon className={`h-4 w-4 ${a.text}`} aria-hidden /></span>
        <span className="text-sm font-semibold text-ink md:text-base">{def.title}</span>
        <span className="hidden font-mono text-[11px] text-slatey-500 sm:inline">{def.tag}</span>
        <span className="ml-auto shrink-0 font-mono text-[11px] text-slatey-500">{def.c === 1 ? `${labs.length}-stage spine` : `${labs.length} artifacts`}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slatey-400 transition-transform duration-200 group-open:rotate-90" aria-hidden />
      </summary>
      <div className="border-t border-line">
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3.5 px-4 py-2 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-slatey-400 sm:grid-cols-[1.75rem_minmax(0,34%)_minmax(0,1fr)_auto]">
          <span aria-hidden />
          <span>Artifact</span>
          <span className="hidden sm:block">Decision it enables</span>
          <span className="text-right">Status</span>
        </div>
        {labs.map((lab, i) => (
          <Link
            key={lab.id}
            href={lab.href ?? "#"}
            className="group/row grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-line px-4 py-2.5 transition hover:bg-canvas sm:grid-cols-[1.75rem_minmax(0,34%)_minmax(0,1fr)_auto]"
          >
            <span className={`text-right font-mono text-[15px] font-bold tabular-nums ${a.num}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className="truncate text-[13px] font-semibold text-ink">{lab.title}</span>
            <span className="hidden truncate text-[11.5px] text-slatey-500 sm:block">{lab.decision}</span>
            <span className="flex items-center justify-end gap-2">
              <StatusPill live={lab.live} />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slatey-300 transition group-hover/row:text-primary" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </details>
  );
}

export function CollectionIndex() {
  return (
    <section id="collections" className="mt-10 scroll-mt-24">
      <div className="mb-4 flex items-baseline gap-2.5">
        <h2 className="text-xl font-semibold tracking-tight text-ink">The collection</h2>
        <span className="font-mono text-[11px] text-slatey-500">every artifact, and the decision it enables</span>
      </div>
      <div className="flex flex-col gap-3">
        {DOMAINS.map((d, i) => <DomainSection key={d.c} def={d} defaultOpen={i === 0} />)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-slatey-500">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> LIVE, runs for real</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden /> SIMULATED, transparent deterministic logic</span>
      </div>
    </section>
  );
}
