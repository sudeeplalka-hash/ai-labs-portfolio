"use client";

import type { EnvelopeCell } from "../engine/types";

const ZONE_FILL: Record<string, string> = { green: "#dcfce7", amber: "#fef3c7", red: "#fee2e2" };
const ZONE_EDGE: Record<string, string> = { green: "#86efac", amber: "#fcd34d", red: "#fca5a5" };

const fmtVol = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`);

/**
 * The Operating Envelope — the Deploy lab's signature visual. A load × cache
 * heat-map of SLO/cost zones with a live operating point. Turn the scale dial or
 * change caching and watch the point drift from the green "safe zone" toward red.
 */
export function OperatingEnvelope({
  cells, volumes, caches, current,
}: {
  cells: EnvelopeCell[];
  volumes: number[];
  caches: number[];
  current: { volume: number; cachePct: number };
}) {
  const W = 640, H = 320, padL = 48, padB = 38, padT = 10, padR = 12;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const cols = volumes.length, rows = caches.length;
  const cw = plotW / cols, ch = plotH / rows;

  // continuous operating point (log-x for load, linear-y for cache, inverted)
  const lmin = Math.log(volumes[0]), lmax = Math.log(volumes[volumes.length - 1]);
  const px = padL + ((Math.log(Math.max(volumes[0], Math.min(volumes[volumes.length - 1], current.volume))) - lmin) / (lmax - lmin)) * plotW;
  const cmax = caches[caches.length - 1];
  const py = padT + (1 - current.cachePct / cmax) * plotH;

  const cellAt = (v: number, c: number) => cells.find((x) => x.volume === v && x.cachePct === c);
  const label = `Operating envelope. Current point: ${fmtVol(current.volume)} queries/day at ${current.cachePct}% cache, in the ${cellAt(nearest(volumes, current.volume), nearest(caches, current.cachePct))?.zone ?? "?"} zone.`;

  return (
    <div role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        {/* cells: rows top→bottom are high→low cache */}
        {caches.slice().reverse().map((c, rIdx) =>
          volumes.map((v, cIdx) => {
            const cell = cellAt(v, c);
            const z = cell?.zone ?? "amber";
            return (
              <rect key={`${v}-${c}`} x={padL + cIdx * cw} y={padT + rIdx * ch} width={cw - 1.5} height={ch - 1.5}
                fill={ZONE_FILL[z]} stroke={ZONE_EDGE[z]} strokeWidth={1} rx={2} />
            );
          }),
        )}
        {/* y ticks (cache) */}
        {caches.slice().reverse().map((c, rIdx) => (
          <text key={`y${c}`} x={padL - 8} y={padT + rIdx * ch + ch / 2 + 3} fontSize="10" fill="#5f6f81" textAnchor="end" fontFamily="ui-monospace">{c}%</text>
        ))}
        {/* x ticks (load) */}
        {volumes.map((v, cIdx) => (
          <text key={`x${v}`} x={padL + cIdx * cw + cw / 2} y={H - padB + 14} fontSize="10" fill="#5f6f81" textAnchor="middle" fontFamily="ui-monospace">{fmtVol(v)}</text>
        ))}
        <text x={padL + plotW / 2} y={H - 4} fontSize="10.5" fill="#46586b" textAnchor="middle">load · queries/day →</text>
        <text x={14} y={padT + plotH / 2} fontSize="10.5" fill="#46586b" textAnchor="middle" transform={`rotate(-90 14 ${padT + plotH / 2})`}>cache % ↑</text>

        {/* operating point */}
        <circle cx={px} cy={py} r={9} fill="none" stroke="#152433" strokeWidth={2} />
        <circle cx={px} cy={py} r={3.5} fill="#152433" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slatey-400">
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: ZONE_FILL.green, outline: `1px solid ${ZONE_EDGE.green}` }} />safe — within SLO, latency &amp; budget</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: ZONE_FILL.amber, outline: `1px solid ${ZONE_EDGE.amber}` }} />margin</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: ZONE_FILL.red, outline: `1px solid ${ZONE_EDGE.red}` }} />breaks here</span>
        <span className="text-slatey-500">● = your current operating point</span>
      </div>
    </div>
  );
}

function nearest(arr: number[], v: number): number {
  return arr.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), arr[0]);
}
