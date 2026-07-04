"use client";

import { useState } from "react";

const MANUAL_HRS = 3.6; // hrs/file with no automation
const FLOOR_HRS = 0.8; // hrs/file fully automated
const HOURLY_RATE = 65; // $/hr loaded analyst cost

export function RoiCalculator() {
  const [volume, setVolume] = useState(500);
  const [automation, setAutomation] = useState(60);

  const effort = MANUAL_HRS - (MANUAL_HRS - FLOOR_HRS) * (automation / 100);
  const hoursSavedMonth = Math.round(volume * (MANUAL_HRS - effort));
  const costSavedYear = Math.round(hoursSavedMonth * 12 * HOURLY_RATE);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-center justify-between text-sm">
            <span className="font-medium text-slatey-200">Files / month</span>
            <span className="font-mono text-xs text-slatey-300">{volume.toLocaleString()}</span>
          </span>
          <input type="range" min={50} max={5000} step={50} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mt-2 w-full accent-primary" />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm">
            <span className="font-medium text-slatey-200">Automation level</span>
            <span className="font-mono text-xs text-slatey-300">{automation}%</span>
          </span>
          <input type="range" min={0} max={100} step={5} value={automation} onChange={(e) => setAutomation(Number(e.target.value))} className="mt-2 w-full accent-primary" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Metric label="Effort / file" value={`${effort.toFixed(1)} hrs`} sub={`was ${MANUAL_HRS} hrs`} />
        <Metric label="Hours saved / mo" value={hoursSavedMonth.toLocaleString()} sub="analyst hours" accent />
        <Metric label="Saved / year" value={`$${(costSavedYear / 1000).toFixed(0)}k`} sub={`at $${HOURLY_RATE}/hr`} accent />
      </div>
      <p className="mt-3 text-[12px] text-slatey-400">
        Automation here = the share of profiling, cleaning, and PII clearance the Data Lab handles before an analyst
        touches the file.
      </p>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-emerald-200 bg-emerald-50/50" : "border-line bg-slate-50"}`}>
      <div className="stat-label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${accent ? "text-emerald-700" : "text-ink"}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[11px] text-slatey-400">{sub}</div>
    </div>
  );
}
