import type { ReactElement } from "react";

// Bespoke per lab cover art. Each motif is a small, flat SVG that depicts what the
// lab actually does (the wire, a scatter, a gauge, a radar…). Drawn in currentColor
// so the parent sets the collection accent; opacity layers give depth. Fills the
// tile's cover band behind the id chip + status marker.

const ART: Record<string, () => ReactElement> = {
  // --- Collection 2 · Agent & Protocol ---
  wire: () => (
    <>
      <rect x="20" y="30" width="30" height="26" rx="4" strokeOpacity=".45" />
      <rect x="170" y="30" width="30" height="26" rx="4" strokeOpacity=".45" />
      <path d="M50 39 H168" strokeOpacity=".85" />
      <path d="M160 34 l8 5 -8 5" strokeOpacity=".85" />
      <path d="M170 49 H52" strokeOpacity=".4" />
      <path d="M60 44 l-8 5 8 5" strokeOpacity=".4" />
      <circle cx="35" cy="43" r="2.4" fill="currentColor" stroke="none" opacity=".7" />
      <circle cx="185" cy="43" r="2.4" fill="currentColor" stroke="none" opacity=".7" />
    </>
  ),
  loop: () => (
    <>
      <path d="M110 22 a22 22 0 1 1 -15 6" strokeOpacity=".6" />
      <path d="M110 22 l-9 -2 2 9" strokeOpacity=".9" />
      <rect x="127" y="52" width="10" height="10" rx="2" fill="currentColor" stroke="none" opacity=".85" />
    </>
  ),
  swarm: () => (
    <>
      <path d="M110 30 L64 60 M110 30 L110 60 M110 30 L156 60" strokeOpacity=".5" />
      <circle cx="110" cy="24" r="8" fill="currentColor" stroke="none" opacity=".9" />
      <circle cx="64" cy="64" r="6" strokeOpacity=".8" />
      <circle cx="110" cy="64" r="6" strokeOpacity=".8" />
      <circle cx="156" cy="64" r="6" strokeOpacity=".8" />
    </>
  ),
  schema: () => (
    <>
      <path d="M74 26 q-10 0 -10 10 v4 q0 6 -6 6 q6 0 6 6 v4 q0 10 10 10" strokeOpacity=".7" />
      <path d="M146 26 q10 0 10 10 v4 q0 6 6 6 q-6 0 -6 6 v4 q0 10 -10 10" strokeOpacity=".7" />
      <path d="M88 40 H132 M88 52 H118" strokeOpacity=".5" />
      <path d="M124 50 l5 6 10 -12" strokeOpacity=".95" />
    </>
  ),
  memory: () => (
    <>
      <rect x="42" y="24" width="136" height="12" rx="3" strokeOpacity=".7" />
      <rect x="42" y="40" width="108" height="12" rx="3" strokeOpacity=".55" />
      <rect x="42" y="56" width="78" height="12" rx="3" strokeOpacity=".4" />
      <rect x="42" y="24" width="22" height="12" rx="3" fill="currentColor" stroke="none" opacity=".55" />
    </>
  ),
  tokens: () => (
    <>
      <path d="M32 70 H190" strokeOpacity=".3" />
      <path d="M32 30 L72 34 L112 45 L152 57 L190 62" strokeOpacity=".85" />
      <circle cx="32" cy="30" r="3" fill="currentColor" stroke="none" />
      <circle cx="72" cy="34" r="3" fill="currentColor" stroke="none" />
      <circle cx="112" cy="45" r="3" fill="currentColor" stroke="none" />
      <circle cx="152" cy="57" r="3" fill="currentColor" stroke="none" />
      <circle cx="190" cy="62" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  branch: () => (
    <>
      <path d="M50 44 H96" strokeOpacity=".6" />
      <path d="M96 44 C120 44 122 26 150 26 M96 44 H150 M96 44 C120 44 122 62 150 62" strokeOpacity=".55" />
      <circle cx="44" cy="44" r="6" fill="currentColor" stroke="none" opacity=".9" />
      <circle cx="156" cy="26" r="5" strokeOpacity=".85" />
      <circle cx="156" cy="44" r="5" fill="currentColor" stroke="none" opacity=".85" />
      <circle cx="156" cy="62" r="5" strokeOpacity=".85" />
    </>
  ),
  gate: () => (
    <>
      <path d="M28 52 H186" strokeOpacity=".35" />
      <path d="M120 43 H150" strokeOpacity=".85" />
      <path d="M126 38 l-6 5 6 5" strokeOpacity=".85" />
      <rect x="150" y="26" width="20" height="34" rx="3" strokeOpacity=".8" />
      <rect x="30" y="46" width="12" height="12" rx="2" fill="currentColor" stroke="none" opacity=".5" />
      <circle cx="160" cy="43" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  // --- Collection 3 · Business of AI ---
  scatter: () => (
    <>
      <path d="M40 68 V20 M40 68 H198" strokeOpacity=".35" />
      <circle cx="72" cy="52" r="6" fill="currentColor" stroke="none" opacity=".35" />
      <circle cx="102" cy="40" r="9" fill="currentColor" stroke="none" opacity=".5" />
      <circle cx="142" cy="33" r="7" fill="currentColor" stroke="none" opacity=".75" />
      <circle cx="168" cy="50" r="5" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="122" cy="57" r="4" fill="currentColor" stroke="none" opacity=".3" />
    </>
  ),
  columns: () => (
    <>
      <path d="M42 70 H192" strokeOpacity=".3" />
      <rect x="62" y="40" width="24" height="30" rx="2" fill="currentColor" stroke="none" opacity=".35" />
      <rect x="102" y="28" width="24" height="42" rx="2" fill="currentColor" stroke="none" opacity=".6" />
      <rect x="142" y="48" width="24" height="22" rx="2" fill="currentColor" stroke="none" opacity=".3" />
    </>
  ),
  crossover: () => (
    <>
      <path d="M30 30 L192 62" strokeOpacity=".8" />
      <path d="M30 64 L192 28" strokeOpacity=".45" />
      <circle cx="111" cy="46" r="9" strokeOpacity=".5" />
      <circle cx="111" cy="46" r="4" fill="currentColor" stroke="none" />
    </>
  ),
  spider: () => (
    <>
      <path d="M110 20 L152 40 L138 76 L82 76 L68 40 Z" strokeOpacity=".4" />
      <path d="M110 40 L132 50 L124 66 L94 64 L88 48 Z" fill="currentColor" fillOpacity=".18" strokeOpacity=".8" />
      <circle cx="110" cy="49" r="2.5" fill="currentColor" stroke="none" />
    </>
  ),
  tornado: () => (
    <>
      <path d="M110 20 V72" strokeOpacity=".35" />
      <rect x="60" y="26" width="100" height="9" rx="2" fill="currentColor" stroke="none" opacity=".55" />
      <rect x="75" y="40" width="70" height="9" rx="2" fill="currentColor" stroke="none" opacity=".45" />
      <rect x="87" y="54" width="46" height="9" rx="2" fill="currentColor" stroke="none" opacity=".35" />
    </>
  ),
  // --- Collection 4 · Engagement Leadership ---
  gauge: () => (
    <>
      <path d="M50 64 A60 60 0 0 1 170 64" strokeOpacity=".35" strokeWidth="6" />
      <path d="M50 64 A60 60 0 0 1 118 24" strokeOpacity=".85" strokeWidth="6" />
      <path d="M110 64 L136 34" strokeOpacity=".9" />
      <circle cx="110" cy="64" r="4" fill="currentColor" stroke="none" />
    </>
  ),
  quadrant: () => (
    <>
      <rect x="46" y="20" width="128" height="52" rx="3" strokeOpacity=".35" />
      <path d="M110 20 V72 M46 46 H174" strokeOpacity=".35" />
      <circle cx="80" cy="34" r="4" fill="currentColor" stroke="none" opacity=".7" />
      <circle cx="142" cy="34" r="5.5" fill="currentColor" stroke="none" opacity=".9" />
      <circle cx="78" cy="58" r="3.5" fill="currentColor" stroke="none" opacity=".5" />
      <circle cx="150" cy="60" r="3.5" fill="currentColor" stroke="none" opacity=".5" />
    </>
  ),
  heatmap: () => {
    const op = [.2, .5, .8, .35, .6, .25, .7, .3, .5, .85, .4, .55, .3, .6, .25, .5, .75, .4];
    const cells: ReactElement[] = [];
    let i = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      cells.push(<rect key={i} x={54 + c * 22} y={24 + r * 18} width="16" height="12" rx="2" fill="currentColor" stroke="none" opacity={op[i]} />);
      i++;
    }
    return <>{cells}</>;
  },
  radar: () => (
    <>
      <rect x="46" y="22" width="128" height="48" rx="3" strokeOpacity=".3" />
      <path d="M46 46 H174" strokeOpacity=".3" />
      <circle cx="78" cy="36" r="5" fill="currentColor" stroke="none" opacity=".85" />
      <path d="M86 34 l7 -5" strokeOpacity=".7" />
      <circle cx="118" cy="52" r="5" fill="currentColor" stroke="none" opacity=".5" />
      <circle cx="150" cy="40" r="5" fill="currentColor" stroke="none" opacity=".3" />
      <path d="M156 44 l6 7" strokeOpacity=".6" />
    </>
  ),
  shield: () => (
    <>
      <path d="M110 20 L146 30 V50 C146 66 130 72 110 78 C90 72 74 66 74 50 V30 Z" strokeOpacity=".6" />
      <path d="M96 46 l10 10 20 -22" strokeOpacity=".95" />
    </>
  ),
  steps: () => (
    <>
      <path d="M40 68 H70 V54 H100 V42 H130 V30 H160 V18" strokeOpacity=".75" />
      <circle cx="160" cy="18" r="3.5" fill="currentColor" stroke="none" />
    </>
  ),
  matrix: () => (
    <>
      <rect x="52" y="26" width="11" height="11" rx="2" strokeOpacity=".7" />
      <path d="M54 32 l2.5 2.5 4 -5" strokeOpacity=".9" />
      <path d="M72 32 H172" strokeOpacity=".45" />
      <rect x="52" y="44" width="11" height="11" rx="2" strokeOpacity=".7" />
      <path d="M54 50 l2.5 2.5 4 -5" strokeOpacity=".9" />
      <path d="M72 50 H154" strokeOpacity=".45" />
      <rect x="52" y="62" width="11" height="11" rx="2" strokeOpacity=".5" />
      <path d="M72 68 H140" strokeOpacity=".3" />
    </>
  ),
  pert: () => (
    <>
      <path d="M40 70 H182" strokeOpacity=".3" />
      <path d="M40 70 Q92 18 111 18 Q130 18 182 70" strokeOpacity=".75" />
      <path d="M70 70 V62 M111 70 V50 M152 70 V62" strokeOpacity=".7" />
    </>
  ),
  timeline: () => (
    <>
      <path d="M42 46 H190" strokeOpacity=".5" />
      <circle cx="70" cy="46" r="6" fill="currentColor" stroke="none" opacity=".9" />
      <circle cx="116" cy="46" r="6" strokeOpacity=".7" />
      <circle cx="162" cy="46" r="6" strokeOpacity=".7" />
    </>
  ),
  slide: () => (
    <>
      <rect x="46" y="22" width="128" height="48" rx="4" strokeOpacity=".5" />
      <path d="M58 34 H120 M58 44 H150" strokeOpacity=".55" />
      <rect x="58" y="52" width="72" height="9" rx="2" fill="currentColor" stroke="none" opacity=".6" />
    </>
  ),
  // --- Collection 1 · Lifecycle ---
  pipeline: () => (
    <>
      <path d="M50 44 H72 M96 44 H118 M142 44 H164" strokeOpacity=".5" />
      <rect x="26" y="34" width="24" height="20" rx="3" strokeOpacity=".7" />
      <rect x="72" y="34" width="24" height="20" rx="3" strokeOpacity=".7" />
      <rect x="118" y="34" width="24" height="20" rx="3" strokeOpacity=".7" />
      <rect x="164" y="34" width="24" height="20" rx="3" fill="currentColor" fillOpacity=".2" strokeOpacity=".8" />
    </>
  ),
  cards: () => (
    <>
      <rect x="62" y="24" width="96" height="16" rx="3" strokeOpacity=".4" />
      <rect x="55" y="34" width="110" height="18" rx="3" strokeOpacity=".6" />
      <rect x="48" y="46" width="124" height="22" rx="3" fill="currentColor" fillOpacity=".08" strokeOpacity=".9" />
      <path d="M58 57 H120" strokeOpacity=".5" />
    </>
  ),
  retrieval: () => (
    <>
      <rect x="50" y="22" width="70" height="52" rx="4" strokeOpacity=".55" />
      <path d="M60 34 H110 M60 44 H110 M60 54 H94" strokeOpacity=".45" />
      <circle cx="140" cy="46" r="16" strokeOpacity=".85" />
      <path d="M152 58 L168 74" strokeOpacity=".85" strokeWidth="3" />
    </>
  ),
  default: () => (
    <>
      <circle cx="82" cy="44" r="6" fill="currentColor" stroke="none" opacity=".55" />
      <circle cx="110" cy="44" r="6" fill="currentColor" stroke="none" opacity=".8" />
      <circle cx="138" cy="44" r="6" fill="currentColor" stroke="none" opacity=".55" />
    </>
  ),
};

const LAB_ART: Record<string, string> = {
  "C1": "pipeline", "C1-backlog": "cards", "C1-rag": "retrieval", "C1-govern": "shield",
  "GAP-01": "wire", "GAP-02": "loop", "GAP-03": "swarm", "GAP-04": "schema", "GAP-05": "memory", "GAP-06": "tokens", "GAP-07": "branch", "GAP-08": "gate",
  "C3-1": "scatter", "C3-2": "columns", "C3-3": "crossover", "C3-4": "spider", "C3-5": "tornado",
  "EL-01": "gauge", "EL-02": "quadrant", "EL-03": "heatmap", "EL-04": "radar", "EL-05": "shield", "EL-06": "steps", "EL-07": "matrix", "EL-08": "pert", "EL-09": "timeline", "EL-10": "slide",
};

export function LabArt({ id, className }: { id: string; className?: string }) {
  const motif = ART[LAB_ART[id] ?? "default"] ?? ART.default;
  return (
    <svg
      viewBox="0 0 220 88"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {motif()}
    </svg>
  );
}
