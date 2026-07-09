// The five flagship "executive decision cases" shown at the top of the Competency
// Map. Split into its own module to keep CompetencyMap.tsx small. Self-contained:
// depends only on next/link, one lucide icon, and the LabEntry type.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type LabEntry } from "@labs/kit";

const HERO_PROOF: Record<string, { proves: string; depth: string; cta: string }> = {
  "GAP-03": {
    proves: "Multiagent architecture economics",
    depth: "Whether additional agents create enough quality lift to justify higher orchestration cost and execution time, translating an impressive technical pattern into an architecture, economics, and operating model decision.",
    cta: "Review the orchestration economics case",
  },
  "GAP-07": {
    proves: "Architecture and protocol decision making",
    depth: "Which protocol best fits a given integration pattern, including the runner up and the condition that would change the recommendation, turning protocol selection into transparent technology strategy rather than a trend driven preference.",
    cta: "Review the protocol strategy case",
  },
  "C3-5": {
    proves: "Business case rigor",
    depth: "Whether a single initiative should be funded, deferred, or reshaped, built on an NPV range instead of a point estimate, with payback, sensitivity analysis showing which assumption the case actually hinges on, and a steering ready verdict.",
    cta: "Review the funding decision case",
  },
  "C3-1": {
    proves: "Capital allocation under risk",
    depth: "Which initiatives deserve funding, which should pause, and which should be stopped before they consume more capital, framing AI investment as a governed capital allocation problem, not a list of promising ideas.",
    cta: "Explore the portfolio strategy dashboard",
  },
  "EL-01": {
    proves: "Adoption and change readiness",
    depth: "Whether to scale, scale with conditions, or hold until adoption risks are addressed, connecting adoption, trust, workflow fit, sponsorship, training, and incentives to the actual scale decision.",
    cta: "Review the adoption strategy decision",
  },
};

export function HeroCaseStudies({ labs }: { labs: LabEntry[] }) {
  return (
    <section className="mb-9 mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">Executive decision cases</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">Start with the five executive decision cases</h2>
        </div>
        <span className="hidden shrink-0 text-xs text-slatey-500 sm:block">~10 minutes &middot; the other 18 show range</span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
        These five artifacts show the portfolio at its strongest: multiagent economics, architecture and protocol
        strategy, capital allocation, business case rigor, and adoption readiness. Each case turns a technical or
        operating question into a decision a senior leader would need to make before scaling AI work.
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
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">{h.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
