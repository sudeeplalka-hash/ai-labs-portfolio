"use client";

import { useState } from "react";
import type { UseCase, BucketKey } from "../engine/types";
import { BUCKETS } from "../engine/params";

// Bespoke value/effort priority matrix. The four quadrants give the scatter
// meaning (a recognizable 2x2), bubble size encodes value-to-effort leverage, and
// hovering a node opens a detail card. Deterministic, dependency-free SVG.
const W = 520, H = 430;
const ML = 48, MR = 16, MT = 16, MB = 48;
const X0 = ML, X1 = W - MR, Y0 = MT, Y1 = H - MB;
const PW = X1 - X0, PH = Y1 - Y0;
const MX = X0 + PW / 2, MY = Y0 + PH / 2;

const px = (effort: number) => X0 + (effort / 100) * PW;
const py = (value: number) => Y1 - (value / 100) * PH;

const QUADRANTS = [
  { label: "Quick wins", x: X0, y: Y0, w: PW / 2, h: PH / 2, fill: "#16a34a", lx: X0 + 10, ly: Y0 + 18, anchor: "start" as const },
  { label: "Big bets", x: MX, y: Y0, w: PW / 2, h: PH / 2, fill: "#7c3aed", lx: X1 - 10, ly: Y0 + 18, anchor: "end" as const },
  { label: "Easy extras", x: X0, y: MY, w: PW / 2, h: PH / 2, fill: "#64748b", lx: X0 + 10, ly: Y1 - 10, anchor: "start" as const },
  { label: "Time sinks", x: MX, y: MY, w: PW / 2, h: PH / 2, fill: "#dc2626", lx: X1 - 10, ly: Y1 - 10, anchor: "end" as const },
];

const radius = (uc: UseCase) => {
  const ratio = uc.value / Math.max(1, uc.effort);
  const t = Math.max(0, Math.min(1, (ratio - 0.6) / 2));
  return 5 + t * 6; // 5..11
};

const quadrantOf = (uc: UseCase) =>
  uc.value >= 50
    ? uc.effort < 50 ? { name: "Quick win", color: "#16a34a" } : { name: "Big bet", color: "#7c3aed" }
    : uc.effort < 50 ? { name: "Easy extra", color: "#64748b" } : { name: "Time sink", color: "#dc2626" };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function BacklogScatter({
  items,
  selectedId,
  onSelect,
}: {
  items: UseCase[];
  selectedId?: number | null;
  onSelect: (uc: UseCase) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const hov = items.find((i) => i.id === hovered) ?? null;
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const label = `Value versus effort matrix of ${items.length} use cases across four buckets. ` +
    items.map((i) => `${i.title}: value ${i.value}, effort ${i.effort}`).join("; ") + ".";

  // draw selected, then hovered, last so they sit on top
  const ordered = [...items].sort(
    (a, b) =>
      (a.id === selectedId ? 1 : 0) - (b.id === selectedId ? 1 : 0) +
      (a.id === hovered ? 2 : 0) - (b.id === hovered ? 2 : 0),
  );

  return (
    <div role="img" aria-label={label} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
        <defs>
          <filter id="bubbleShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#152433" floodOpacity="0.22" />
          </filter>
        </defs>

        {QUADRANTS.map((q) => (
          <g key={q.label}>
            <rect x={q.x} y={q.y} width={q.w} height={q.h} fill={q.fill} fillOpacity={0.05} />
            <text x={q.lx} y={q.ly} textAnchor={q.anchor} fontSize="9.5" fontWeight="700" fill={q.fill} fillOpacity={0.7} letterSpacing="0.4">
              {q.label.toUpperCase()}
            </text>
          </g>
        ))}

        <rect x={X0} y={Y0} width={PW} height={PH} fill="none" stroke="#e4e7eb" strokeWidth={1} />
        <line x1={MX} y1={Y0} x2={MX} y2={Y1} stroke="#cdd4dc" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={X0} y1={MY} x2={X1} y2={MY} stroke="#cdd4dc" strokeWidth={1} strokeDasharray="4 4" />

        {[0, 50, 100].map((n) => (
          <text key={`x${n}`} x={px(n)} y={Y1 + 16} textAnchor="middle" fontSize="9.5" fill="#9aa7b4">{n}</text>
        ))}
        {[0, 50, 100].map((n) => (
          <text key={`y${n}`} x={X0 - 8} y={py(n) + 3} textAnchor="end" fontSize="9.5" fill="#9aa7b4">{n}</text>
        ))}
        <text x={MX} y={H - 8} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#5f6f81">Effort →</text>
        <text x={14} y={MY} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#5f6f81" transform={`rotate(-90 14 ${MY})`}>Value →</text>

        {/* soft glow behind the hovered node */}
        {hov && hov.id !== selectedId && (
          <circle cx={px(hov.effort)} cy={py(hov.value)} r={radius(hov) + 9} fill={BUCKETS[hov.bucket].color} fillOpacity={0.14} />
        )}

        {/* soft pulsing halo on the selected (strongest) bet */}
        {selected && (() => {
          const cx = px(selected.effort), cy = py(selected.value), c = BUCKETS[selected.bucket].color, r0 = radius(selected) + 3;
          return (
            <g>
              <circle cx={cx} cy={cy} r={r0} fill={c} fillOpacity={0.16}>
                <animate attributeName="r" values={`${r0};${r0 + 11};${r0}`} dur="2.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
                <animate attributeName="fill-opacity" values="0.22;0;0.22" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx} cy={cy} r={r0} fill="none" stroke={c} strokeWidth={2} strokeOpacity={0.5} />
            </g>
          );
        })()}

        {ordered.map((uc) => {
          const sel = uc.id === selectedId;
          const isHov = uc.id === hovered;
          const r = radius(uc) + (sel ? 2 : 0) + (isHov ? 2 : 0);
          const c = BUCKETS[uc.bucket].color;
          return (
            <g
              key={uc.id}
              onClick={() => onSelect(uc)}
              onMouseEnter={() => setHovered(uc.id)}
              onMouseLeave={() => setHovered((h) => (h === uc.id ? null : h))}
              style={{ cursor: "pointer" }}
            >
              <title>{`${uc.title}, value ${uc.value} · effort ${uc.effort}`}</title>
              {/* invisible larger hit area for easier hovering */}
              <circle cx={px(uc.effort)} cy={py(uc.value)} r={r + 8} fill="transparent" />
              <circle
                cx={px(uc.effort)} cy={py(uc.value)} r={r}
                fill={c} fillOpacity={sel || isHov ? 1 : 0.85}
                stroke="#ffffff" strokeWidth={2}
                filter="url(#bubbleShadow)"
              />
            </g>
          );
        })}
      </svg>

      {/* caption: explains why the pulsing node holds the top spot */}
      <p className="mt-1 flex items-center justify-center gap-2 text-center text-[11px] leading-relaxed text-slatey-400">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        The pulsing node is your recommended bet, click any node to switch, or hover for detail.
      </p>

      {/* hover detail card */}
      {hov && (() => {
        const cx = px(hov.effort), cy = py(hov.value);
        const leftPct = clamp((cx / W) * 100, 17, 83);
        const topPct = (cy / H) * 100;
        const below = cy < 150; // node near the top → drop the card beneath it
        const q = quadrantOf(hov);
        const b = BUCKETS[hov.bucket];
        const ratio = (hov.value / Math.max(1, hov.effort)).toFixed(2);
        return (
          <div
            className="pointer-events-none absolute z-20 w-60 rounded-xl border border-line bg-white p-3"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: below ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 14px))",
              boxShadow: "0 10px 28px rgba(21,36,51,0.18)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: b.soft, color: b.text }}>{hov.bucket}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: q.color }}>{q.name}</span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-ink">{hov.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slatey-400">{hov.desc}</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2 text-center">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slatey-500">Value</p>
                <p className="font-mono text-sm font-semibold text-ink">{hov.value}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slatey-500">Effort</p>
                <p className="font-mono text-sm font-semibold text-ink">{hov.effort}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slatey-500">Ratio</p>
                <p className="font-mono text-sm font-semibold" style={{ color: q.color }}>{ratio}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
