// Shareable per-use-case pages — a canonical, SEO'd URL for every worked scenario
// (/industries/uc/<id>). Statically generated from the registry (generateStaticParams),
// with per-use-case metadata (title/description/OpenGraph) computed from the same data
// the labs read — so a shared link renders a real analyst card and opens the live lab
// pre-loaded to that exact industry scenario. Fully static (output: export compatible).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ALL_USE_CASES, INDUSTRIES, LAB_ROUTES, labHref } from "@labs/kit";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_USE_CASES.map((uc) => ({ id: uc.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const uc = ALL_USE_CASES.find((u) => u.id === params.id);
  if (!uc) return { title: "Use-case not found" };
  const ind = INDUSTRIES[uc.industry];
  const prov = uc.provenance.kind === "first-hand" ? "First-hand" : "Studied";
  const title = `${uc.title} · ${ind.label}`;
  const description = `${uc.oneLiner} — ${uc.takeaway}`;
  return {
    title,
    description,
    keywords: [ind.label, uc.labId, prov, "AI delivery", "engagement leadership", "use case"],
    openGraph: { title: `${title} — AI Labs Portfolio`, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-400">{k}</p>
      <p className="mt-1 text-sm leading-relaxed text-slatey-300">{v}</p>
    </div>
  );
}

export default function UseCasePage({ params }: { params: { id: string } }) {
  const uc = ALL_USE_CASES.find((u) => u.id === params.id);
  if (!uc) return notFound();

  const ind = INDUSTRIES[uc.industry];
  const route = LAB_ROUTES[uc.labId];
  const fh = uc.provenance.kind === "first-hand";

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Portfolio
          </Link>
          <Link href="/industries" className="text-xs font-medium text-slatey-400 hover:text-ink">Industry Atlas</Link>
          <span className="ml-auto font-mono text-[11px] text-slatey-500">{uc.labId}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-5 md:py-10">
        {/* Identity */}
        <div className="mb-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span aria-hidden className="text-lg">{ind.emoji}</span>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ind.accent }}>{ind.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${fh ? "text-white" : "border border-line bg-slate-50 text-slatey-400"}`}
              style={fh ? { background: ind.accent } : undefined}
              title={fh ? "Grounded in first-hand delivery" : "Informed by public industry patterns"}
            >
              {fh ? "First-hand" : "Studied"}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{uc.title}</h1>
          <p className="mt-2 text-base italic text-slatey-400">{uc.oneLiner}</p>
        </div>

        {/* Primary CTA — open the live lab pre-loaded */}
        <Link
          href={labHref(uc.labId, uc.id)}
          className="group mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:bg-slate-50"
          style={{ borderColor: `${ind.accent}55`, borderLeftWidth: 4, borderLeftColor: ind.accent }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">Open the live lab · pre-loaded to this scenario</p>
            <p className="text-sm font-semibold text-ink">{route?.name ?? uc.labId}</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-slatey-400 transition group-hover:translate-x-0.5 group-hover:text-ink" />
        </Link>

        {/* The analyst brief */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field k="Context" v={uc.context} />
          <Field k="The decision" v={uc.theDecision} />
          <Field k="What most miss" v={uc.whatMostMiss} />
          <Field k="Stakes" v={uc.stakes} />
        </div>

        {/* Takeaway */}
        <div className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ background: `${ind.accent}12`, color: ind.accent }}>
          <span className="font-semibold">Takeaway · </span>{uc.takeaway}
        </div>

        {/* Provenance / sources */}
        <div className="mt-6 border-t border-line pt-4 text-xs text-slatey-500">
          <p>
            <span className="font-semibold text-slatey-400">{fh ? "First-hand" : "Studied"}</span> · {route?.collection ?? "Lab"} ·{" "}
            verified {uc.lastVerified}
          </p>
          <p className="mt-1">Sources: {uc.sources.join("; ")}</p>
          <p className="mt-3">
            <Link href="/industries" className="font-medium text-primary hover:underline">← All industries</Link>
            <span className="mx-2 text-line">·</span>
            <Link href="/storylines" className="font-medium text-primary hover:underline">See it in a full program storyline →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
