// Measured-outcome framing — the market wants "one improvement with measured lift", not just
// the decision. Each flagship renders this after its recommendation: the call, the expected
// lift (labelled illustrative — SIMULATED, no live telemetry), and how you'd actually measure
// it in production. Presentational + server-safe.
export function OutcomeFrame({ call, lift, measure }: { call: string; lift: string; measure: string }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3.5">
      <p className="stat-label mb-2">If you act on this <span className="font-normal text-slatey-500">· the call &rarr; expected lift &rarr; how you&apos;d measure it</span></p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">The call</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slatey-300">{call}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Expected lift <span className="font-normal normal-case text-slatey-500">· illustrative</span></p>
          <p className="mt-0.5 text-xs leading-relaxed text-slatey-300">{lift}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slatey-500">How you&apos;d measure it</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slatey-300">{measure}</p>
        </div>
      </div>
    </div>
  );
}
