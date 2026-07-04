// Storylines — the "follow one program end-to-end" view. The labs are instruments;
// this is the operator using them in sequence on a single program. Each step links
// (and deep-links via ?uc=) into the relevant lab. Pure presentational; data lives
// in @labs/kit (STORYLINES) so the narrative is a first-class, versioned artifact.

import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { STORYLINES, LAB_ROUTES, labHref, INDUSTRIES, type Storyline } from "@labs/kit";

export function Storylines() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">Storylines</span>
          <Link href="/industries" className="ml-auto text-xs font-medium text-primary hover:underline">Industry Atlas →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-7">
          <p className="eyebrow mb-1 inline-flex items-center gap-1.5"><Compass className="h-3.5 w-3.5" /> Depth · one program, end to end</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">The labs are instruments. This is the operator.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Any one lab is a tool. Delivery leadership is knowing which to reach for, in what order, on a real program.
            Each storyline walks a single initiative through the instruments in the sequence you actually hit them — every
            step opens the live lab, some pre-loaded to the exact industry scenario.
          </p>
        </div>

        <div className="space-y-8">
          {STORYLINES.map((s) => (
            <StorylineCard key={s.id} story={s} />
          ))}
        </div>

        <p className="mt-10 border-t border-line pt-4 text-xs text-slatey-500">
          Every step is a real, working lab — nothing here is a mockup. Steps marked with an industry chip open that lab
          pre-loaded to the named use-case. Explore the same instruments by industry in the{" "}
          <Link href="/industries" className="font-medium text-primary hover:underline">Industry Atlas</Link>.
        </p>
      </main>
    </div>
  );
}

function StorylineCard({ story }: { story: Storyline }) {
  const ind = INDUSTRIES[story.industry];
  const fh = story.provenance.kind === "first-hand";
  return (
    <section className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: `${ind.accent}33`, borderLeftWidth: 4, borderLeftColor: ind.accent }}>
      {/* Header */}
      <div className="border-b border-line px-5 py-4" style={{ background: `${ind.accent}0a` }}>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span aria-hidden className="text-lg">{ind.emoji}</span>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{story.title}</h2>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${fh ? "text-white" : "border border-line bg-slate-50 text-slatey-400"}`}
            style={fh ? { background: ind.accent } : undefined}
            title={fh ? "Grounded in first-hand delivery" : "Informed by public industry patterns"}
          >
            {fh ? "First-hand" : "Studied"}
          </span>
        </div>
        <p className="text-sm font-medium" style={{ color: ind.accent }}>{story.hook}</p>
        <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slatey-400">{story.arc}</p>
        <p className="mt-2 font-mono text-[11px] text-slatey-500">{story.steps.length} stages · {ind.label}</p>
      </div>

      {/* Timeline */}
      <ol className="relative px-5 py-4">
        {story.steps.map((step, i) => {
          const route = LAB_ROUTES[step.labId];
          const last = i === story.steps.length - 1;
          return (
            <li key={`${step.labId}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
              {/* Rail + node */}
              <div className="relative flex flex-col items-center">
                <span
                  className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: ind.accent }}
                >
                  {i + 1}
                </span>
                {!last && <span className="absolute top-7 h-full w-px" style={{ background: `${ind.accent}40` }} />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{step.stage}</p>
                <Link
                  href={labHref(step.labId, step.ucId)}
                  className="group mt-0.5 block rounded-lg border border-line px-3 py-2.5 transition hover:border-ink/30 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slatey-500">{step.labId}</span>
                    <span className="text-[13px] font-semibold text-ink">{step.headline}</span>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slatey-400 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slatey-400">{step.detail}</p>
                  <p className="mt-1.5 text-[11px] text-slatey-500">
                    {route?.name ?? step.labId}
                    {step.ucId && <span className="ml-1.5 rounded px-1.5 py-0.5 font-medium" style={{ background: `${ind.accent}18`, color: ind.accent }}>pre-loaded: {ind.label}</span>}
                  </p>
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
