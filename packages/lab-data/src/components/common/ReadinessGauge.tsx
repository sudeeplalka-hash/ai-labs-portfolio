"use client";

type Color = "emerald" | "amber" | "orange" | "rose";

const STROKE: Record<Color, string> = {
  emerald: "#16a34a",
  amber: "#d97706",
  orange: "#ea580c",
  rose: "#dc2626",
};

// The value and arc show the same current score immediately, with no count-up delay.
export function ReadinessGauge({
  value,
  color,
  label = "Ingestion readiness",
}: {
  value: number;
  color: Color;
  label?: string;
}) {
  const shown = Math.round(Math.max(0, Math.min(100, value)));

  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, shown));
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
      <div className="relative h-32 w-32 shrink-0" role="meter" aria-label={label} aria-valuenow={shown} aria-valuemin={0} aria-valuemax={100}>
        <svg aria-hidden="true" viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#eef1f4" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={STROKE[color]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-ink">{shown}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-slatey-400">/ 100</span>
        </div>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="mt-1 text-sm text-slatey-300">
          A weighted score across every org guideline. Apply fixes to see the current readiness against the gate.
        </div>
      </div>
    </div>
  );
}
