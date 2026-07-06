// Narrative case-study layer — the skimmable read reviewers actually spend time on (problem →
// approach → why → metric → trade-off → outcome), for someone who would rather read the story
// than drive the tool. Collapsible so it never gets in the way of the instrument. Server-safe.
export interface CaseStudyProps {
  problem: string;
  approach: string;
  why: string;
  metric: string;
  tradeoff: string;
  outcome: string;
}
export function CaseStudy(p: CaseStudyProps) {
  const beats: [string, string][] = [
    ["Problem", p.problem],
    ["Approach", p.approach],
    ["Why this way", p.why],
    ["The metric", p.metric],
    ["The trade-off", p.tradeoff],
    ["Outcome", p.outcome],
  ];
  return (
    <details className="mb-5 rounded-xl border border-line bg-white p-4 shadow-card">
      <summary className="cursor-pointer text-sm font-semibold text-ink">Prefer to read? The 2-minute case study <span className="font-normal text-slatey-500">· problem &rarr; approach &rarr; metric &rarr; outcome</span></summary>
      <div className="mt-3 space-y-2.5">
        {beats.map(([k, v]) => (
          <div key={k} className="grid gap-1 sm:grid-cols-[120px_1fr]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{k}</p>
            <p className="text-sm leading-relaxed text-slatey-300">{v}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
