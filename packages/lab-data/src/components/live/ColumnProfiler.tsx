"use client";

import { useState } from "react";
import type { ColumnProfile } from "@data/lib/prep/types";
import { cn } from "@data/lib/cn";

const TYPE_COLOR: Record<string, string> = {
  number: "bg-primary",
  string: "bg-teal-500",
  date: "bg-violet-500",
  bool: "bg-amber-500",
  empty: "bg-slate-300",
};

export function ColumnProfiler({ columns }: { columns: ColumnProfile[] }) {
  const [active, setActive] = useState(0);
  const col = columns[active];
  if (!col) return null;
  const missPct = col.total ? (col.missing / col.total) * 100 : 0;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {columns.map((c, i) => (
          <button
            key={c.name + i}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
              i === active
                ? "bg-primary/10 text-primary ring-primary/25"
                : "bg-white text-slatey-300 ring-line hover:bg-slate-50",
            )}
          >
            {c.name || `col ${i + 1}`}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-slate-50 p-3">
          <div className="stat-label">Dominant type</div>
          <div className="mt-1 text-lg font-semibold capitalize text-ink">{col.dominantType}</div>
        </div>
        <div className="rounded-lg border border-line bg-slate-50 p-3">
          <div className="stat-label">Missing</div>
          <div className="mt-1 text-lg font-semibold text-ink">
            {Math.round(missPct)}
            <span className="text-sm text-slatey-400">%</span>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-slate-50 p-3">
          <div className="stat-label">Distinct</div>
          <div className="mt-1 text-lg font-semibold text-ink">{col.distinct.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="stat-label mb-1.5">Type mix</div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {Object.entries(col.types).map(([t, n]) => (
            <div
              key={t}
              className={cn("h-full", TYPE_COLOR[t] ?? "bg-slate-400")}
              style={{ width: `${(n / Math.max(1, col.total)) * 100}%` }}
              title={`${t}: ${n}`}
            />
          ))}
        </div>
      </div>

      {col.samples.length > 0 && (
        <div className="mt-4">
          <div className="stat-label mb-1.5">Sample values</div>
          <div className="flex flex-wrap gap-1.5">
            {col.samples.map((s, i) => (
              <span key={i} className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[11px] text-slatey-200">
                {s.length > 32 ? s.slice(0, 32) + "…" : s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
