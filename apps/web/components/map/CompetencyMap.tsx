// Layer 0, the Competency Map, repositioned as "Technology Strategy and AI
// Artifacts": radial-navy hero + executive metric band + featured decision cases
// + rich collection preview cards, with the full per-collection shelves kept below
// as browse detail (cards deep-link to them via anchors). Command Center design
// system (ink + brand blue, Public Sans). Static, no client JS.

import Link from "next/link";
import {
  Workflow, Boxes, LineChart, Users,
  CircleCheck, Hammer, Clock, ArrowRight, Mail,
  type LucideIcon,
} from "lucide-react";
import { LiveBadge } from "@labs/design-system";
import {
  labById, labsByCollection, LABS, progress, ALL_USE_CASES,
  type LabEntry, type Collection as Col,
} from "@labs/kit";
import { HeroCaseStudies } from "./HeroCaseStudies";

const COVER_IMAGE: Record<string, string> = {};

type Accent = { band: string; text: string; dot: string; ring: string; chip: string };
const ACCENT: Record<string, Accent> = {
  blue: { band: "bg-primary-soft", text: "text-primary", dot: "bg-primary", ring: "ring-primary/40", chip: "bg-primary-soft" },
  teal: { band: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-600", ring: "ring-teal-500/40", chip: "bg-teal-50" },
  amber: { band: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-500/40", chip: "bg-amber-50" },
  violet: { band: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-600", ring: "ring-violet-500/40", chip: "bg-violet-50" },
};
const ACCENT_BAR: Record<string, string> = { blue: "bg-primary", teal: "bg-teal-600", amber: "bg-amber-500", violet: "bg-violet-600" };

const COLLECTION_ACCENT: Record<number, string> = { 1: "blue", 2: "teal", 3: "amber", 4: "violet" };
const tileAccent = (lab: LabEntry): Accent => ACCENT[COLLECTION_ACCENT[lab.collection] ?? "blue"];

type Sample = { id: string; label: string };
type CollectionDef = {
  c: Col; title: string; tag: string; accent: string; icon: LucideIcon;
  anchor: string; href?: string; samples: Sample[];
};
// One source for both the preview cards and the browse shelves. Samples pull from
// the registry so links and LIVE/SIMULATED status stay truthful.
const COLLECTIONS: CollectionDef[] = [
  {
    c: 1, title: "Enterprise AI Lifecycle", tag: "The working program spine, frame to operate.",
    accent: "blue", icon: Workflow, anchor: "c1", href: "/lifecycle",
    samples: [{ id: "C1-rag", label: "RAG Quality Evaluator" }, { id: "C1-corpus", label: "Corpus Intelligence" }],
  },
  {
    c: 2, title: "Agent Architecture and Protocols", tag: "Integration and orchestration decision models.",
    accent: "teal", icon: Boxes, anchor: "c2",
    samples: [{ id: "GAP-03", label: "Multiagent Orchestration Economics" }, { id: "GAP-07", label: "Protocol Selection Decision Model" }],
  },
  {
    c: 3, title: "AI Investment and Economics", tag: "Capital allocation, build-buy, run-rate, ROI.",
    accent: "amber", icon: LineChart, anchor: "c3",
    samples: [{ id: "C3-1", label: "Capital Allocation Dashboard" }, { id: "C3-5", label: "Business Case and ROI Builder" }],
  },
  {
    c: 4, title: "Operating Model and Adoption", tag: "Governance, readiness, and executive alignment.",
    accent: "violet", icon: Users, anchor: "c4",
    samples: [{ id: "EL-01", label: "Adoption Readiness Instrument" }, { id: "EL-04", label: "Delivery Health and RAID Radar" }],
  },
];
const collectionCount = (c: Col): number => (c === 1 ? labsByCollection(1).length + 1 : labsByCollection(c).length);

function StatusIcon({ status }: { status: LabEntry["status"] }) {
  if (status === "shipped") return <CircleCheck role="img" className="h-4 w-4 text-emerald-600" aria-label="shipped" />;
  if (status === "in-build") return <Hammer role="img" className="h-4 w-4 text-amber-600" aria-label="in build" />;
  return <Clock role="img" className="h-4 w-4 text-slate-400" aria-label="planned" />;
}
const statusLabel = (s: LabEntry["status"]) => (s === "shipped" ? "Shipped" : s === "in-build" ? "In build" : "Planned");

function Tile({ lab }: { lab: LabEntry }) {
  const accent = tileAccent(lab);
  const linkable = !!lab.href;
  const cover = COVER_IMAGE[lab.id];

  const inner = (
    <div className={`group relative flex h-full w-[15rem] max-w-[80vw] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-cardhover hover:ring-1 ${accent.ring}`}>
      <div className={`relative h-24 overflow-hidden ${accent.band}`}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span className={`absolute left-2 top-2 rounded bg-white/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${accent.text}`}>{lab.id}</span>
        <span className="absolute right-2 top-2 rounded-md bg-white/80 p-0.5"><StatusIcon status={lab.status} /></span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h4 className="text-sm font-semibold leading-snug text-ink">{lab.title}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-slatey-400">{lab.problem}</p>
        <div className="mt-2 flex items-center gap-1.5">{lab.live && <LiveBadge mode={lab.live} />}</div>
        <p className="mt-2 line-clamp-2 border-t border-line pt-2 text-[11px] leading-snug text-slatey-500">
          <span className={`font-semibold ${accent.text}`}>Decision:</span> {lab.decision}
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col bg-white p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${accent.text}`}>{lab.id}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slatey-500"><StatusIcon status={lab.status} />{statusLabel(lab.status)}</span>
        </div>
        <h4 className="mt-1.5 text-sm font-semibold leading-snug text-ink">{lab.title}</h4>
        <p className="mt-1 text-[11px] leading-snug text-slatey-400">{lab.problem}</p>
        <div className="mt-2 flex items-center gap-1.5">{lab.live && <LiveBadge mode={lab.live} />}</div>
        <p className="mt-auto text-[11px] leading-snug text-slatey-500">
          <span className={`font-semibold ${accent.text}`}>Decision:</span> {lab.decision}
        </p>
        <span className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${linkable ? "text-primary" : "text-slatey-400"}`}>
          {linkable ? <>View the artifact <ArrowRight className="h-3 w-3" /></> : statusLabel(lab.status)}
        </span>
      </div>
    </div>
  );

  return linkable ? (
    <Link href={lab.href!} className="group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">{inner}</Link>
  ) : (
    <div aria-disabled>{inner}</div>
  );
}

function Shelf({ id, title, tag, accent, icon: Icon, labs, href }: {
  id?: string; title: string; tag: string; accent: Accent; icon: LucideIcon; labs: LabEntry[]; href?: string;
}) {
  return (
    <section id={id} className="mt-9 scroll-mt-24">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${accent.chip}`}><Icon className={`h-3.5 w-3.5 ${accent.text}`} aria-hidden /></span>
        <h3 className="text-base font-semibold text-ink md:text-lg">{title}</h3>
        <span className="font-mono text-[11px] text-slatey-500">{tag} &middot; {labs.length}</span>
        {href && (
          <Link href={href} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="shelf-row -mx-1 flex gap-4 overflow-x-auto px-1 pt-2 pb-4">
        {labs.map((l) => <Tile key={l.id} lab={l} />)}
      </div>
    </section>
  );
}

// Executive metric band, computed from the registry so figures never drift.
function MetricBand() {
  const p = progress();
  const metrics = [
    { value: String(p.total), label: "working AI artifacts" },
    { value: String(ALL_USE_CASES.length), label: "industry use cases" },
    { value: "4", label: "decision domains" },
    { value: "100%", label: "badged live / simulated" },
  ];
  return (
    <div className="grid grid-cols-4 text-white" style={{ background: "#0e1923" }}>
      {metrics.map((m, i) => (
        <div key={m.label} className={`px-3 py-4 md:px-5 ${i < 3 ? "border-r border-white/10" : ""}`}>
          <div className="text-xl font-bold md:text-2xl">{m.value}</div>
          <div className="mt-0.5 text-[10px] leading-tight text-slate-400 md:text-[11px]">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

function CollectionCard({ def }: { def: CollectionDef }) {
  const accent = ACCENT[def.accent];
  const Icon = def.icon;
  const count = collectionCount(def.c);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className={`h-[3px] ${ACCENT_BAR[def.accent]}`} />
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${accent.chip}`}><Icon className={`h-3.5 w-3.5 ${accent.text}`} aria-hidden /></span>
            <span className="truncate text-sm font-semibold text-ink">{def.title}</span>
          </span>
          <span className="shrink-0 text-[11px] font-semibold text-slatey-500">{count} artifacts</span>
        </div>
        <p className="mt-1.5 text-xs leading-snug text-slatey-400">{def.tag}</p>
        <div className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
          {def.samples.map((s) => {
            const lab = labById(s.id);
            const isLive = lab?.live === "LIVE";
            return (
              <Link key={s.id} href={lab?.href ?? "#"} className="flex items-center gap-2 text-[12px] text-ink hover:text-primary">
                <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
                <span className="truncate">{s.label}</span>
              </Link>
            );
          })}
        </div>
        <a href={`#${def.anchor}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Open collection <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function CollectionCards() {
  return (
    <section id="collections" className="mt-10 scroll-mt-24">
      <div className="mb-4 flex items-baseline gap-2.5">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Four artifact collections</h2>
        <span className="font-mono text-[11px] text-slatey-500">strategy, architecture to adoption</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {COLLECTIONS.map((def) => <CollectionCard key={def.c} def={def} />)}
      </div>
    </section>
  );
}

export function CompetencyMap() {
  const featured = LABS.filter((l) => l.flagship);
  const c1labs = [labById("C1"), ...labsByCollection(1)].filter(Boolean) as LabEntry[];

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-5">
          <span className="font-semibold text-ink">
            Sudeep Lalka
            <span className="ml-2 hidden text-xs font-normal text-slatey-500 sm:inline">Technology Strategy and AI Artifacts</span>
          </span>
          <a href="mailto:sudeeplalka@gmail.com" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Discussing a role?</span><span className="sm:hidden">Contact</span>
          </a>
        </div>
      </header>

      <section
        className="text-white"
        style={{ background: "radial-gradient(1100px 600px at 72% 30%, #1d3a5c 0%, #152433 55%, #0e1923 100%)" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-5 md:py-24">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary md:text-xs">Technology strategy &middot; AI artifacts</p>
          <h1 className="mt-4 max-w-3xl text-[1.75rem] font-bold leading-[1.1] tracking-tight md:mt-5 md:text-5xl">
            Enterprise AI strategy, proven in <span className="italic text-primary">working artifacts</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300 md:mt-5 md:text-lg">
            A portfolio of 23 interactive AI artifacts that turn the architecture, economics, governance, and adoption
            decisions behind enterprise AI into tools that actually run &mdash; strategy you can open, pressure-test, and
            take into the boardroom.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-slate-100">Built with AI, end to end</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">Client-side &middot; deterministic</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">Live in the browser</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#collections" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
              Explore the artifacts <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/storylines" className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
              Follow the strategy <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MetricBand />

      <main className="mx-auto max-w-6xl px-4 pb-6 md:px-5">
        <HeroCaseStudies labs={featured} />
        <CollectionCards />

        <section className="mt-10">
          <div className="mb-1 flex items-baseline gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Browse every artifact</h2>
            <span className="font-mono text-[11px] text-slatey-500">all 23, by collection</span>
          </div>
          <Shelf id="c1" title={COLLECTIONS[0].title} tag={COLLECTIONS[0].tag} accent={ACCENT.blue} icon={COLLECTIONS[0].icon} labs={c1labs} href="/lifecycle" />
          {COLLECTIONS.slice(1).map((col) => (
            <Shelf
              key={col.c}
              id={col.anchor}
              title={col.title}
              tag={col.tag}
              accent={ACCENT[col.accent]}
              icon={col.icon}
              labs={labsByCollection(col.c)}
              href={col.href}
            />
          ))}
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-14 md:px-5">
        <div className="border-t border-line pt-6 text-sm text-slatey-400">
          <p className="max-w-3xl leading-relaxed">
            Honest by design. Every artifact shows its status, assumptions, formulas, and limitations. LIVE modules
            run as working artifacts. SIMULATED modules use deterministic logic, visible assumptions, and modeled
            scenarios. Each one exists to make a decision, a tradeoff, or a piece of technology strategy concrete.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="mailto:sudeeplalka@gmail.com" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
              <Mail className="h-4 w-4" /> Discussing a role? <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/storylines" className="text-slatey-500 hover:text-ink hover:underline">Program storylines</Link>
            <Link href="/industries" className="text-slatey-500 hover:text-ink hover:underline">Industry Atlas</Link>
            <Link href="/changelog" className="text-slatey-500 hover:text-ink hover:underline">Changelog</Link>
            <span className="font-mono text-[11px] text-slatey-500">build {process.env.NEXT_PUBLIC_BUILD_SHA ?? "local"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
