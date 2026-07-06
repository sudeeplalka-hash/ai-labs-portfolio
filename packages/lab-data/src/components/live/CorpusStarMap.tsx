"use client";

import { useState } from "react";
import type { CorpusFile, DupPair } from "@data/lib/prep/corpus";

// Status colors tuned for a light plot.
const GATE_HEX: Record<string, string> = {
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  rose: "#f43f5e",
};

const EDGE: Record<DupPair["kind"], string> = {
  duplicate: "#f43f5e",
  "stale-version": "#f59e0b",
  "near-duplicate": "#94a3b8",
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Corpus similarity map: a 2D projection where distance = content similarity, so
// duplicates and stale versions fall into tight clusters. Light, on-theme.
export function CorpusStarMap({
  files,
  pairs,
  selectedId,
  onSelect,
}: {
  files: CorpusFile[];
  pairs: DupPair[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const byId = new Map(files.map((f) => [f.id, f]));
  const activeId = hover ?? selectedId;
  const active = activeId ? byId.get(activeId) : undefined;

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[460px]">
        <svg viewBox="0 0 100 100" className="w-full rounded-xl border border-line bg-gradient-to-br from-slate-50 to-white" preserveAspectRatio="xMidYMid meet">
          {/* soft grid */}
          {[20, 40, 60, 80].map((g) => (
            <g key={g}>
              <line x1={g} y1="4" x2={g} y2="96" stroke="rgba(21,36,51,0.06)" strokeWidth="0.3" />
              <line x1="4" y1={g} x2="96" y2={g} stroke="rgba(21,36,51,0.06)" strokeWidth="0.3" />
            </g>
          ))}

          {/* edges between related docs */}
          {pairs.map((p, i) => {
            const a = byId.get(p.aId);
            const b = byId.get(p.bId);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={EDGE[p.kind]}
                strokeWidth={p.kind === "near-duplicate" ? 0.4 : 0.7}
                strokeDasharray={p.kind === "stale-version" ? "1.5 1.2" : undefined}
                opacity={0.55}
              />
            );
          })}

          {/* soft pulsing ring on the active node */}
          {active && (
            <g>
              <circle cx={active.x} cy={active.y} r={4.6} fill="none" stroke={GATE_HEX[active.gate.color]} strokeWidth="0.6" opacity={0.5} />
              <circle cx={active.x} cy={active.y} r={4.6} fill="none" stroke={GATE_HEX[active.gate.color]} strokeWidth="0.6">
                <animate attributeName="r" values="4.6;7.4;4.6" dur="2.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* dots */}
          {files.map((f) => {
            const on = f.id === activeId;
            return (
              <g key={f.id} className="cursor-pointer" onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(f.id)}>
                <circle cx={f.x} cy={f.y} r={on ? 2.9 : 2.1} fill={GATE_HEX[f.gate.color]} stroke="#ffffff" strokeWidth="0.7" />
              </g>
            );
          })}

          {/* axis hint: this plane spreads documents by content similarity */}
          <text x="50" y="99" textAnchor="middle" fontSize="2.6" fill="#9aa7b4" fontWeight="600">documents spread by content similarity</text>
        </svg>

        {/* hover / selected tooltip, clamped & wrapping so it never clips */}
        {active && (() => {
          const below = active.y < 24;
          return (
            <div
              className="pointer-events-none absolute z-10 w-44 max-w-[70%] -translate-x-1/2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-cardhover"
              style={{
                left: `${clamp(active.x, 12, 88)}%`,
                top: `${active.y}%`,
                transform: below ? "translate(-50%, 12px)" : "translate(-50%, calc(-100% - 12px))",
              }}
            >
              <div className="break-all font-mono font-medium text-ink">{active.name}</div>
              <div className="mt-0.5 text-slatey-400">
                {active.gate.gate} · score {active.score} · {active.tokens.toLocaleString()} tokens
              </div>
            </div>
          );
        })()}
      </div>

      {/* grounding caption */}
      <p className="mx-auto mt-2 max-w-[460px] text-center text-[11px] leading-relaxed text-slatey-400">
        Each dot is a document. The closer two dots sit, the more similar their content, tight clusters are usually duplicates or versions of the same doc. Lines flag exact duplicates and stale versions.
      </p>

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slatey-400">
        <span className="flex items-center gap-1"><Dot c="#10b981" /> Approved</span>
        <span className="flex items-center gap-1"><Dot c="#f59e0b" /> Conditional</span>
        <span className="flex items-center gap-1"><Dot c="#f97316" /> Hold</span>
        <span className="flex items-center gap-1"><Dot c="#f43f5e" /> Rejected</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0 w-4 border-t-2 border-rose-400" /> duplicate</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0 w-4 border-t-2 border-dashed border-amber-400" /> stale version</span>
      </div>
    </div>
  );
}

function Dot({ c }: { c: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />;
}
