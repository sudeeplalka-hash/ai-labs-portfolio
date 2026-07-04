"use client";

import Link from "next/link";
import type { StageKey } from "@labs/program-core";
import type { RiverFlow } from "../engine/types";

const STAGE_HREF: Record<StageKey, string> = { frame: "/frame", data: "/data", build: "/build", deploy: "/deploy", govern: "/govern", realize: "/realize", operate: "/operate" };
const STAGE_LABEL: Record<StageKey, string> = { frame: "Frame", data: "Data", build: "Build", deploy: "AI Ops", govern: "Govern", realize: "Realize", operate: "Operate" };
const usd = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  return a >= 1000 ? `${s}$${Math.round(a / 1000).toLocaleString()}k` : `${s}$${Math.round(a)}`;
};

// A proper waterfall / bridge chart: start at the addressable value, step DOWN
// for every leak (adoption, quality, run cost, risk), and land on the
// risk-adjusted value. Each drop is labelled and links to the stage that caused
// it. This replaces the old "river of bars", which was hard to read.
export function ValueWaterfall({ flows }: { flows: RiverFlow[] }) {
  const inFlow = flows.find((f) => f.kind === "in")!;
  const leaks = flows.filter((f) => f.kind === "leak");
  const out = flows.find((f) => f.kind === "out")!;

  // Build the columns with running totals.
  type Col = { key: string; label: string; source: StageKey; kind: "total" | "leak"; top: number; bottom: number; delta: number };
  const cols: Col[] = [];
  cols.push({ key: "in", label: inFlow.label, source: inFlow.source, kind: "total", top: inFlow.amount, bottom: 0, delta: inFlow.amount });
  let running = inFlow.amount;
  for (const f of leaks) {
    const after = running - f.amount;
    cols.push({ key: f.key, label: f.label, source: f.source, kind: "leak", top: running, bottom: after, delta: -f.amount });
    running = after;
  }
  cols.push({ key: "out", label: out.label, source: out.source, kind: "total", top: Math.max(out.amount, 0), bottom: Math.min(out.amount, 0), delta: out.amount });

  // Scale (include 0 and any negative final).
  const maxV = Math.max(inFlow.amount, 0);
  const minV = Math.min(0, out.amount);
  const span = maxV - minV || 1;

  const W = 720, H = 300;
  const padT = 34, padB = 78, padL = 12, padR = 12;
  const plotH = H - padT - padB;
  const n = cols.length;
  const colW = (W - padL - padR) / n;
  const barW = colW * 0.62;
  const yOf = (v: number) => padT + ((maxV - v) / span) * plotH;
  const y0 = yOf(0);

  return (
    <div role="img" aria-label={`Value bridge: ${usd(inFlow.amount)} addressable down to ${usd(out.amount)} risk-adjusted.`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {/* zero baseline */}
        <line x1={padL} y1={y0} x2={W - padR} y2={y0} stroke="#152433" strokeOpacity={0.15} strokeWidth={1} />

        {cols.map((c, idx) => {
          const cx = padL + idx * colW + colW / 2;
          const x = cx - barW / 2;
          const isTotal = c.kind === "total";
          const isFinal = idx === n - 1;
          const yTop = yOf(Math.max(c.top, c.bottom));
          const yBot = yOf(Math.min(c.top, c.bottom));
          const barH = Math.max(2, yBot - yTop);
          const fill = isTotal ? (isFinal ? (out.amount >= 0 ? "#16a34a" : "#e11d48") : "#1f6fc4") : "#e11d48";
          const op = isTotal ? 0.9 : 0.32;
          const stroke = isTotal ? (isFinal ? (out.amount >= 0 ? "#15803d" : "#be123c") : "#1f6fc4") : "#e11d48";

          // connector from this bar's landing level to the next bar's start level
          const connectorY = yOf(c.bottom);
          const nextX = padL + (idx + 1) * colW + colW / 2 - barW / 2;

          return (
            <g key={c.key}>
              {idx < n - 1 && (
                <line x1={x + barW} y1={connectorY} x2={nextX} y2={connectorY} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
              )}
              <rect x={x} y={yTop} width={barW} height={barH} rx={3} fill={fill} fillOpacity={op} stroke={stroke} strokeOpacity={0.5} />
              {/* delta label above the bar */}
              <text x={cx} y={yTop - 7} fontSize="12" fontWeight="700" textAnchor="middle" fill={c.kind === "leak" ? "#dc2626" : "#152433"}>
                {c.kind === "leak" ? usd(c.delta) : usd(c.delta)}
              </text>
            </g>
          );
        })}

        {/* category labels + source (leaks clickable) */}
        {cols.map((c, idx) => {
          const cx = padL + idx * colW + colW / 2;
          const label = (
            <>
              <text x={cx} y={H - padB + 20} fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#152433">{shortLabel(c.label)}</text>
              {c.kind === "leak" && (
                <text x={cx} y={H - padB + 34} fontSize="9" textAnchor="middle" fill="#1f6fc4">from {STAGE_LABEL[c.source]} →</text>
              )}
            </>
          );
          return c.kind === "leak"
            ? <a key={c.key} href={STAGE_HREF[c.source]} aria-label={`${c.label} ${usd(c.delta)} — from ${c.source}`}>{label}</a>
            : <g key={c.key}>{label}</g>;
        })}
      </svg>
      <p className="mt-1 text-[11px] text-slatey-500">Read left to right: the tall blue bar is everything on the table; each red step is value lost, traced to the stage that caused it; the green bar is what's left — defensible.</p>
    </div>
  );
}

// keep x-axis labels tidy
function shortLabel(l: string): string {
  return l
    .replace("Addressable value", "Addressable")
    .replace("Risk-adjusted value", "Risk-adjusted")
    .replace(" gap", "");
}
