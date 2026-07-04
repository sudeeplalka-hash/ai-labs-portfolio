"use client";

import { useEffect, useState } from "react";

type Color = "emerald" | "amber" | "orange" | "rose";

const STROKE: Record<Color, string> = {
  emerald: "#16a34a",
  amber: "#d97706",
  orange: "#ea580c",
  rose: "#dc2626",
};

// Animated radial readiness gauge (count-up + arc fill). Honors reduced-motion.
export function ReadinessGauge({
  value,
  color,
  label = "Ingestion readiness",
}: {
  value: number;
  color: Color;
  label?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = shown;
    const dur = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, shown));
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
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
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
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
          A weighted score across every org guideline. Apply fixes to watch it climb toward the gate.
        </div>
      </div>
    </div>
  );
}
