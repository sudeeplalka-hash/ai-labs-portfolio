// Layer 0, the Competency Map, repositioned as "Technology Strategy and AI
// Artifacts": radial-navy hero + executive metric band + five featured decision
// cases (HeroCaseStudies) + the accordion/numbered browse (CollectionIndex).
// Command Center design system (ink + brand blue, Public Sans). Static, no client JS.

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { LABS, progress, ALL_USE_CASES } from "@labs/kit";
import { HeroCaseStudies } from "./HeroCaseStudies";
import { CollectionIndex } from "./CollectionIndex";

// Executive metric band, computed from the registry so figures never drift. The 25
// is the catalog (collections 2-5); the Lifecycle is the spine, shown separately.
function MetricBand() {
  const p = progress();
  const metrics = [
    { value: String(p.total), label: "catalog AI artifacts" },
    { value: String(ALL_USE_CASES.length), label: "industry use cases" },
    { value: "4", label: "decision domains" },
    { value: "100%", label: "execution mode disclosed" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 text-white" style={{ background: "#0e1923" }}>
      {metrics.map((m, i) => (
        <div key={m.label} className={`px-3 py-4 md:px-5 ${i < 3 ? "border-r border-white/10" : ""}`}>
          <div className="text-xl font-bold md:text-2xl">{m.value}</div>
          <div className="mt-0.5 text-[10px] leading-tight text-slate-300 md:text-xs">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

export function CompetencyMap() {
  const featured = LABS.filter((l) => l.flagship);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">Skip to portfolio</a>
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
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-5 md:py-16">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200 md:text-xs">Technology strategy &middot; AI artifacts</p>
          <h1 className="mt-4 max-w-3xl text-[1.75rem] font-bold leading-[1.1] tracking-tight md:mt-5 md:text-5xl">
            Enterprise AI strategy, proven in <span className="italic text-blue-200">working artifacts</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300 md:mt-5 md:text-lg">
            A portfolio of {progress().total} AI artifacts that turn the architecture, economics, governance, and adoption
            decisions behind enterprise AI into tools that actually run. Strategy you can open, pressure-test, and take
            into the boardroom.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-slate-100">Built with AI, end to end</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">Client-side &middot; deterministic</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">Live in the browser</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#cases" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">
              Start with a two-minute case <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/storylines" className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
              Follow a complete program <ArrowRight className="h-4 w-4" />
            </Link>
          <a href="#collections" className="mt-4 inline-block text-sm text-slate-200 underline underline-offset-4">Browse every artifact</a></div>
        </div>
      </section>

      <MetricBand />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-6 md:px-5">
        <div className="mt-8 grid gap-4 border-b border-line pb-7 md:grid-cols-[1fr_2fr]"><p className="text-sm font-semibold">Sudeep Lalka<br/><span className="font-normal text-slatey-400">Technology strategy · AI delivery</span></p><p className="text-sm leading-relaxed text-slatey-400">Inspect how I connect architecture, investment, governance, and people decisions. Each working artifact exposes its model, assumptions, and tradeoffs so you can evaluate the judgment behind it.</p></div><HeroCaseStudies labs={featured} />
        <CollectionIndex />
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
