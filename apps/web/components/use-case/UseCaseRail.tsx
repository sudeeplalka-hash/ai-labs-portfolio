"use client";

// Shared use-case layer UI — one rail + one brief, imported by every lab that has
// use-cases. Lives in apps/web (not the design system) so it can read the industry
// registry and UseCase type from @labs/kit without coupling the two packages.
// The rail is the selector; the brief is the analyst one-pager. Selecting a chip
// tells the lab to applyUseCase(payload) and slides the brief in over the engine.

import { INDUSTRIES, type UseCase } from "@labs/kit";

export function UseCaseRail({
  useCases,
  activeId,
  onSelect,
}: {
  useCases: UseCase[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slatey-500">
        Same instrument · three industries{" "}
        <span className="font-normal normal-case text-slatey-400">— pick a use-case to reconfigure the run</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onSelect(null)}
          aria-pressed={activeId === null}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            activeId === null
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-slatey-400 hover:border-ink/40 hover:text-ink"
          }`}
        >
          Default
        </button>
        {useCases.map((uc) => {
          const ind = INDUSTRIES[uc.industry];
          const on = uc.id === activeId;
          const fh = uc.provenance.kind === "first-hand";
          return (
            <button
              key={uc.id}
              onClick={() => onSelect(uc.id)}
              aria-pressed={on}
              title={`${ind.label}: ${uc.oneLiner}`}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                on ? "text-white" : "bg-white text-slatey-400 hover:text-ink"
              }`}
              style={on ? { background: ind.accent, borderColor: ind.accent } : { borderColor: `${ind.accent}55` }}
            >
              <span aria-hidden>{ind.emoji}</span>
              <span>{ind.label}</span>
              {fh && (
                <span
                  className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: on ? "#ffffff" : ind.accent }}
                  title="first-hand"
                  aria-label="first-hand"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function UseCaseBrief({ useCase }: { useCase: UseCase }) {
  const ind = INDUSTRIES[useCase.industry];
  const fh = useCase.provenance.kind === "first-hand";
  return (
    <div
      className="mb-4 rounded-xl border bg-white p-4"
      style={{ borderColor: `${ind.accent}55`, borderLeftWidth: 3, borderLeftColor: ind.accent }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span aria-hidden className="text-base">{ind.emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ind.accent }}>{ind.label}</span>
        <span className="text-sm font-semibold text-ink">{useCase.title}</span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            fh ? "text-white" : "border border-line bg-slate-50 text-slatey-400"
          }`}
          style={fh ? { background: ind.accent } : undefined}
          title={fh ? "You ran this pattern first-hand" : "Informed by public industry patterns"}
        >
          {fh ? "First-hand" : "Studied"}
        </span>
      </div>

      <p className="mb-3 text-sm italic text-slatey-400">{useCase.oneLiner}</p>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <Field k="Context" v={useCase.context} />
        <Field k="The decision" v={useCase.theDecision} />
        <Field k="What most miss" v={useCase.whatMostMiss} />
        <Field k="Stakes" v={useCase.stakes} />
      </div>

      <div className="mt-3 rounded-md px-3 py-2 text-xs" style={{ background: `${ind.accent}12`, color: ind.accent }}>
        <span className="font-semibold">Takeaway · </span>
        {useCase.takeaway}
      </div>

      <p className="mt-2 text-[10px] text-slatey-500">
        {fh ? "First-hand" : "Studied"} · sources: {useCase.sources.join("; ")} · verified {useCase.lastVerified}
      </p>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-line bg-slate-50/50 p-2.5">
      <p className="text-[11px] font-semibold text-slatey-400">{k}</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-slatey-300">{v}</p>
    </div>
  );
}
