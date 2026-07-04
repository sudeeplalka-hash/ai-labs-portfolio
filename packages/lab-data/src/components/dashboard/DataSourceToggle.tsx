"use client";

import { Database, Radio } from "lucide-react";
import { cn } from "@data/lib/cn";

export type DataSource = "demo" | "live";

export function DataSourceToggle({
  value,
  onChange,
  liveCount,
}: {
  value: DataSource;
  onChange: (v: DataSource) => void;
  liveCount: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
      <button
        onClick={() => onChange("demo")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "demo" ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
        )}
      >
        <Database className="h-3.5 w-3.5" /> Demo
      </button>
      <button
        onClick={() => onChange("live")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          value === "live" ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
        )}
      >
        <Radio className="h-3.5 w-3.5" /> Your sessions
        <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", liveCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slatey-400")}>
          {liveCount}
        </span>
      </button>
    </div>
  );
}

export function LiveEmpty() {
  return (
    <div className="panel p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <Radio className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">No live sessions yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slatey-300">
        Run a file through the <a href="/data" className="font-medium text-primary hover:underline">Live Data Lab</a> or load a
        corpus in the <a href="/data/corpus" className="font-medium text-primary hover:underline">Corpus Builder</a>, then this
        dashboard recomputes from your real activity.
      </p>
    </div>
  );
}
