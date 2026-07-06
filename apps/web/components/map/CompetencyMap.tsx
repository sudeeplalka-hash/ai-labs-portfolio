// Layer 0, the Competency Map, presented as a cinematic browse gallery (§C0/§B4).
// Streaming-service layout: radial-navy hero + horizontal "shelves" per collection
// with poster tiles. Uses the Command Center design system EXACTLY (ink + brand
// blue, Public Sans, shared card/shadow tokens). One comprehensive view, no
// audience toggle. Each tile derives its color + icon from its OWN collection, so
// mixed shelves (Featured) render each instrument in its true collection theme.
// Static (no client JS): hover quick-look + scroll are pure CSS.

import Link from "next/link";
import {
  Workflow, Boxes, LineChart, Users,
  CircleCheck, Hammer, Clock, ArrowRight, Mail,
  type LucideIcon,
} from "lucide-react";
import { LiveBadge } from "@labs/design-system";
import {
  labById, labsByCollection, LABS,
  type LabEntry, type Collection as Col,
} from "@labs/kit";

// Drop a real image URL per lab id here to swap the placeholder cover for artwork.
const COVER_IMAGE: Record<string, string> = {};

type Accent = { band: string; text: string; dot: string; ring: string; chip: string };
const ACCENT: Record<string, Accent> = {
  blue: { band: "bg-primary-soft", text: "text-primary", dot: "bg-primary", ring: "ring-primary/40", chip: "bg-primary-soft" },
  teal: { band: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-600", ring: "ring-teal-500/40", chip: "bg-teal-50" },
  amber: { band: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-500/40", chip: "bg-amber-50" },
  violet: { band: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-600", ring: "ring-violet-500/40", chip: "bg-violet-50" },
};

const COLLECTION_ACCENT: Record<number, string> = { 1: "blue", 2: "teal", 3: "amber", 4: "violet" };
const tileAccent = (lab: LabEntry): Accent => ACCENT[COLLECTION_ACCENT[lab.collection] ?? "blue"];

const COLLECTIONS: { c: Col; title: string; tag: string; accent: string; icon: LucideIcon; href?: string }[] = [
  { c: 1, title: "Enterprise AI Lifecycle", tag: "live · the spine", accent: "blue", icon: Workflow, href: "/lifecycle" },
  { c: 2, title: "Agent & Protocol Labs", tag: "the toolkit", accent: "teal", icon: Boxes },
  { c: 3, title: "Business of AI Delivery", tag: "the gallery", accent: "amber", icon: LineChart },
  { c: 4, title: "Engagement Leadership", tag: "the control room", accent: "violet", icon: Users },
];

function StatusIcon({ status }: { status: LabEntry["status"] }) {
  if (status === "shipped") return <CircleCheck className="h-4 w-4 text-emerald-600" aria-label="shipped" />;
  if (status === "in-build") return <Hammer className="h-4 w-4 text-amber-600" aria-label="in build" />;
  return <Clock className="h-4 w-4 text-slate-400" aria-label="planned" />;
}
const statusLabel = (s: LabEntry["status"]) => (s === "shipped" ? "Shipped" : s === "in-build" ? "In build" : "Planned");

function Tile({ lab }: { lab: LabEntry }) {
  const accent = tileAccent(lab);
  const linkable = !!lab.href; // link whenever a route exists; status badge tells the truth
  const cover = COVER_IMAGE[lab.id];

  const inner = (
    <div className={`group relative flex h-full w-[15rem] max-w-[80vw] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-cardhover hover:ring-1 ${accent.ring}`}>
      {/* Cover, clean tinted band for now; drop an image into COVER_IMAGE to swap */}
      <div className={`relative h-24 overflow-hidden ${accent.band}`}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span className={`absolute left-2 top-2 rounded bg-white/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${accent.text}`}>{lab.id}</span>
        <span className="absolute right-2 top-2 rounded-md bg-white/80 p-0.5"><StatusIcon status={lab.status} /></span>
      </div>

      {/* Resting body */}
      <div className="flex flex-1 flex-col p-3">
        <h4 className="text-sm font-semibold leading-snug text-ink">{lab.title}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-slatey-400">{lab.problem}</p>
        <div className="mt-2 flex items-center gap-1.5">{lab.live && <LiveBadge mode={lab.live} />}</div>
        <p className="mt-2 line-clamp-2 border-t border-line pt-2 text-[11px] leading-snug text-slatey-500">
          <span className={`font-semibold ${accent.text}`}>Decision:</span> {lab.decision}
        </p>
      </div>

      {/* Hover quick-look, full detail, no truncation (desktop nicety; pointer-events
          off so the wrapping link still receives the click) */}
      <div className="pointer-events-none absolute inset-0 flex flex-col bg-white p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
          {linkable ? <>Open the lab <ArrowRight className="h-3 w-3" /></> : statusLabel(lab.status)}
        </span>
      </div>
    </div>
  );

  return linkable ? (
    <Link href={lab.href!} className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">{inner}</Link>
  ) : (
    <div aria-disabled>{inner}</div>
  );
}

function Shelf({ title, tag, accent, icon: Icon, labs, href }: {
  title: string; tag: string; accent: Accent; icon: LucideIcon; labs: LabEntry[]; href?: string;
}) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${accent.chip}`}><Icon className={`h-3.5 w-3.5 ${accent.text}`} aria-hidden /></span>
        <h3 className="text-base font-semibold text-ink md:text-lg">{title}</h3>
        <span className="font-mono text-[11px] text-slatey-500">{tag} · {labs.length}</span>
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

const HERO_PROOF: Record<string, { proves: string; depth: string }> = {
  "GAP-01": { proves: "Protocol & integration architecture", depth: "A working MCP client, browse a server's manifest, compose a call, read the JSON-RPC round-trip with honest typed errors, build a custom tool, watch the initialize handshake. The N\u00d7M\u2192N+M case made concrete." },
  "GAP-03": { proves: "Multiagent orchestration judgment", depth: "Supervisor \u2192 role agents over A2A messages you can inspect frame-by-frame, an agent timeline, and a tested single-vs-multi scorecard \u2014 quality bought with cost and latency." },
  "GAP-07": { proves: "Architecture decision-making", depth: "Six questions \u2192 function-calling vs MCP vs A2A vs hybrid, with the runner-up, exactly what would flip the call, a four-protocol radar, and a shareable recommendation card." },
  "C3-1": { proves: "Capital allocation under risk", depth: "Twelve initiatives governed like capital \u2014 risk adjusted ROI, kill/hold/scale, budget-constrained greedy funding, the efficient frontier, and redeploy-the-kills." },
  "EL-01": { proves: "Change-management rigor", depth: "Six weighted readiness factors \u2192 a scale/hold gate \u2192 the fewest moves to clear it, a sequenced two-week plan, and the projected path to the gate." },
};

function HeroCaseStudies({ labs }: { labs: LabEntry[] }) {
  return (
    <section className="mb-9 mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">Read these five first</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">The deep case studies &mdash; each a tested decision tool</h2>
        </div>
        <span className="hidden shrink-0 text-xs text-slatey-500 sm:block">~10 minutes &middot; the other 18 show range</span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
        If you have ten minutes, start here. Each of these five is a pure, unit-tested engine driving a real decision &mdash; the assumptions are labelled, and every one shows <span className="text-ink">what would change the call</span>. The shelves below show range across the same lifecycle.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {labs.map((l) => {
          const h = HERO_PROOF[l.id];
          if (!h) return null;
          return (
            <Link key={l.id} href={l.href ?? "#"} className="group flex flex-col rounded-xl border border-line bg-white p-4 shadow-card transition hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">{l.id}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{h.proves}</span>
              </div>
              <h3 className="mt-1.5 text-base font-semibold text-ink group-hover:text-primary">{l.title}</h3>
              <p className="mt-0.5 text-xs font-medium text-slatey-300">{l.decision}</p>
              <p className="mt-2 text-xs leading-relaxed text-slatey-400">{h.depth}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Open the case study <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CompetencyMap() {
  const featured = LABS.filter((l) => l.flagship);
  const c1labs = [labById("C1"), ...labsByCollection(1)].filter(Boolean) as LabEntry[];

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-5">
          <span className="font-semibold text-ink">
            Sudeep Lalka
            <span className="ml-2 hidden text-xs font-normal text-slatey-500 sm:inline">AI Delivery Leadership</span>
          </span>
          <a href="mailto:sudeeplalka@gmail.com" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Discussing a role?</span><span className="sm:hidden">Contact</span>
          </a>
        </div>
      </header>

      {/* Cinematic hero, radial-navy field + italic blue accent (matches sudeeplalka.com) */}
      <section
        className="text-white"
        style={{ background: "radial-gradient(1100px 600px at 72% 30%, #1d3a5c 0%, #152433 55%, #0e1923 100%)" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-5 md:py-24">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary md:text-xs">One person · four altitudes</p>
          <h1 className="mt-4 max-w-3xl text-[1.75rem] font-bold leading-[1.1] tracking-tight md:mt-5 md:text-5xl">
            AI delivery leader who works at <span className="italic text-primary">four altitudes</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300 md:mt-5 md:text-lg">
            The protocol wire, the program lifecycle, the P&amp;L, and the people, a portfolio of working
            instruments, each mapped to a decision a VP actually makes.
          </p>
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-slate-400 md:text-xs">
            Engagement Manager, HCLTech @ American Express · STEM MBA (AI &amp; Quant, UT Austin) · PMP · AWS SA
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/storylines" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
              Follow a program end-to-end <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/industries" className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
              Explore by industry <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Shelves */}
      <main className="mx-auto max-w-6xl px-4 pb-6 md:px-5">
        <HeroCaseStudies labs={featured} />
        <Shelf title={COLLECTIONS[0].title} tag={COLLECTIONS[0].tag} accent={ACCENT.blue} icon={COLLECTIONS[0].icon} labs={c1labs} href="/lifecycle" />
        {COLLECTIONS.slice(1).map((col) => (
          <Shelf
            key={col.c}
            title={col.title}
            tag={col.tag}
            accent={ACCENT[col.accent]}
            icon={col.icon}
            labs={labsByCollection(col.c)}
            href={col.href}
          />
        ))}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 pb-14 md:px-5">
        <div className="border-t border-line pt-6 text-sm text-slatey-400">
          <p className="max-w-3xl leading-relaxed">
            Honest by design, every tile shows its true status (shipped, in build, or planned) and the enterprise
            decision it maps to. Collection 1 is live; Collections 2 to 4 build in public. Nothing here is a demo for its
            own sake.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="mailto:sudeeplalka@gmail.com" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
              <Mail className="h-4 w-4" /> Discussing a role? <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/storylines" className="text-slatey-500 hover:text-ink hover:underline">Storylines</Link>
            <Link href="/industries" className="text-slatey-500 hover:text-ink hover:underline">Industry Atlas</Link>
            <Link href="/changelog" className="text-slatey-500 hover:text-ink hover:underline">Changelog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
