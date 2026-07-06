"use client";

import { RotateCcw } from "lucide-react";
import type { PrepConfig } from "@data/lib/prep/engine";
import { DEFAULT_CONFIG } from "@data/lib/prep/engine";
import { cn } from "@data/lib/cn";

// Lets a user tune the org-policy thresholds and re-score the file live.
export function ThresholdControls({
  config,
  onChange,
}: {
  config: PrepConfig;
  onChange: (c: PrepConfig) => void;
}) {
  const set = <K extends keyof PrepConfig>(k: K, v: PrepConfig[K]) => onChange({ ...config, [k]: v } as PrepConfig);
  const isDefault =
    config.maxMissingPct === DEFAULT_CONFIG.maxMissingPct &&
    config.maxDupPct === DEFAULT_CONFIG.maxDupPct &&
    config.piiStrict === DEFAULT_CONFIG.piiStrict &&
    config.requireMetadata === DEFAULT_CONFIG.requireMetadata;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-center justify-between text-sm">
            <span className="font-medium text-slatey-200">Max missing values</span>
            <span className="font-mono text-xs text-slatey-300">{config.maxMissingPct}%</span>
          </span>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={config.maxMissingPct}
            onChange={(e) => set("maxMissingPct", Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <span className="text-[11px] text-slatey-400">Above this, missing values are flagged at risk.</span>
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm">
            <span className="font-medium text-slatey-200">Max duplicate rows</span>
            <span className="font-mono text-xs text-slatey-300">{config.maxDupPct}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={config.maxDupPct}
            onChange={(e) => set("maxDupPct", Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <span className="text-[11px] text-slatey-400">Above this, duplicates are flagged at risk.</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          label="Strict PII policy"
          hint="Any PII, not just SSN/card, becomes a hard blocker."
          on={config.piiStrict}
          onClick={() => set("piiStrict", !config.piiStrict)}
        />
        <Toggle
          label="Require metadata tagging"
          hint="Enforce domain / owner / sensitivity / date tags."
          on={config.requireMetadata}
          onClick={() => set("requireMetadata", !config.requireMetadata)}
        />
      </div>

      {!isDefault && (
        <button
          onClick={() => onChange({ ...DEFAULT_CONFIG })}
          className="inline-flex items-center gap-1 text-xs font-medium text-slatey-300 hover:text-slatey-100"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to standard policy
        </button>
      )}
    </div>
  );
}

function Toggle({ label, hint, on, onClick }: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-start gap-3 rounded-lg border border-line bg-white p-3 text-left transition-colors hover:bg-slate-50">
      <span
        className={cn(
          "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          on ? "bg-primary" : "bg-slate-300",
        )}
      >
        <span className={cn("h-4 w-4 rounded-full bg-white transition-transform", on ? "translate-x-4" : "translate-x-0")} />
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-slatey-400">{hint}</span>
      </span>
    </button>
  );
}
