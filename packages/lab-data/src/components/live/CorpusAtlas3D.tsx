"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { CorpusFile, DupPair } from "@data/lib/prep/corpus";
import { Badge } from "@data/components/common/Badge";

// Corpus Atlas · 3D view (reworked). Analyst-console grammar: the scene is
// STATIC until the user acts, no autoplay, no motion for its own sake.
// Drag orbits, wheel or buttons zoom, hover raises a document card, click
// selects and syncs with the file tray, Reset returns to the home view.
// House light theme; depth is carried by a floor grid + bounding box and
// distance attenuation rather than spin.

const GATE_HEX: Record<string, string> = {
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  rose: "#f43f5e",
};
const EDGE_HEX: Record<DupPair["kind"], string> = {
  duplicate: "#f43f5e",
  "stale-version": "#f59e0b",
  "near-duplicate": "#94a3b8",
};
const INK = "#152433";
const LINE = "rgba(21,36,51,0.08)";
const LINE_SOFT = "rgba(21,36,51,0.05)";

const piiHits = (f: CorpusFile): number => f.report.pii.reduce((a, b) => a + b.count, 0);
const isStale = (f: CorpusFile): boolean => {
  const c = f.report.checks.find((x) => x.guideline === "freshness");
  return !!c && c.level !== "healthy";
};

const HOME = { yaw: 0.62, pitch: 0.34, zoom: 1 };

export function CorpusAtlas3D({
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [view, setView] = useState({ ...HOME });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const screenPts = useRef<Map<string, { sx: number; sy: number; r: number }>>(new Map());

  // Render exactly once per state change: static scene, no animation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const W = wrap.clientWidth;
    const H = Math.max(260, Math.round(W * 0.68));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const { yaw, pitch, zoom } = view;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cam = 3.2;
    const scale = Math.min(W, H) * 0.34 * zoom;

    const proj = (x: number, y: number, z: number) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const w = cam / (cam - z2);
      return { sx: W / 2 + x1 * w * scale, sy: H / 2 - y2 * w * scale, w };
    };
    const norm = (v: number) => (v - 50) / 42;

    // ---- depth scaffolding: floor grid + bounding box (static cues) ----
    ctx.lineWidth = 1;
    const G = 1.15;
    for (let i = 0; i <= 6; i++) {
      const t = -G + (2 * G * i) / 6;
      const a1 = proj(t, -G, -G);
      const b1 = proj(t, -G, G);
      const a2 = proj(-G, -G, t);
      const b2 = proj(G, -G, t);
      ctx.strokeStyle = LINE_SOFT;
      ctx.beginPath(); ctx.moveTo(a1.sx, a1.sy); ctx.lineTo(b1.sx, b1.sy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a2.sx, a2.sy); ctx.lineTo(b2.sx, b2.sy); ctx.stroke();
    }
    const corners: [number, number, number][] = [
      [-G, -G, -G], [G, -G, -G], [G, -G, G], [-G, -G, G],
      [-G, G, -G], [G, G, -G], [G, G, G], [-G, G, G],
    ];
    const boxEdges: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    ctx.strokeStyle = LINE;
    for (const [a, b] of boxEdges) {
      const pa = proj(...corners[a]);
      const pb = proj(...corners[b]);
      ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
    }

    const byId = new Map(files.map((f) => [f.id, f]));
    const maxTokens = Math.max(...files.map((f) => f.tokens), 1);

    // ---- relation edges ----
    for (const p of pairs) {
      const a = byId.get(p.aId);
      const b = byId.get(p.bId);
      if (!a || !b) continue;
      const pa = proj(norm(a.x), norm(a.y), norm(a.z));
      const pb = proj(norm(b.x), norm(b.y), norm(b.z));
      ctx.strokeStyle = EDGE_HEX[p.kind];
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = p.kind === "near-duplicate" ? 1 : 1.4;
      ctx.setLineDash(p.kind === "stale-version" ? [5, 3] : []);
      ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // ---- documents (far → near) ----
    const drawn = files
      .map((f) => ({ f, s: proj(norm(f.x), norm(f.y), norm(f.z)) }))
      .sort((a, b) => a.s.w - b.s.w);
    screenPts.current.clear();
    for (const { f, s } of drawn) {
      const active = f.id === (hoverId ?? selectedId);
      const base = 4 + 5 * Math.sqrt(f.tokens / maxTokens);
      const r = base * s.w * (active ? 1.25 : 1);
      const depthFade = 0.55 + 0.45 * Math.min(1, Math.max(0, (s.w - 0.7) / 0.7));
      ctx.globalAlpha = (isStale(f) && !active ? 0.45 : 1) * depthFade;

      // drop hint on the floor for depth reading
      const foot = proj(norm(f.x), -G, norm(f.z));
      ctx.fillStyle = "rgba(21,36,51,0.06)";
      ctx.beginPath(); ctx.ellipse(foot.sx, foot.sy, r * 0.7, r * 0.24, 0, 0, Math.PI * 2); ctx.fill();

      if (piiHits(f) > 0) {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.1;
        ctx.setLineDash([3, 2.4]);
        ctx.beginPath(); ctx.arc(s.sx, s.sy, r + 3.4, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = GATE_HEX[f.gate.color] ?? "#64748b";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(s.sx, s.sy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (active) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(s.sx, s.sy, r + 2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      screenPts.current.set(f.id, { sx: s.sx, sy: s.sy, r: Math.max(r, 7) });
    }
  }, [files, pairs, selectedId, hoverId, view]);

  const pick = (clientX: number, clientY: number): string | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: { id: string; d: number } | null = null;
    for (const [id, p] of screenPts.current) {
      const d = Math.hypot(p.sx - x, p.sy - y);
      if (d <= p.r + 5 && (!best || d < best.d)) best = { id, d };
    }
    return best?.id ?? null;
  };

  const hovered = hoverId ? files.find((f) => f.id === hoverId) : null;
  const hoverPt = hoverId ? screenPts.current.get(hoverId) : null;
  const zoomBy = (k: number) => setView((v) => ({ ...v, zoom: Math.min(2.4, Math.max(0.5, v.zoom * k)) }));

  return (
    <div ref={wrapRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="3D corpus atlas: documents positioned by content similarity. Drag to orbit, scroll or use the buttons to zoom, click a document to inspect it."
        tabIndex={0}
        className="w-full cursor-grab rounded-xl border border-line bg-gradient-to-br from-slate-50 to-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;
            if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true;
            setView((v) => ({
              ...v,
              yaw: v.yaw + dx * 0.008,
              pitch: Math.max(-1.25, Math.min(1.25, v.pitch + dy * 0.006)),
            }));
            drag.current = { x: e.clientX, y: e.clientY, moved: drag.current.moved };
          } else {
            setHoverId(pick(e.clientX, e.clientY));
          }
        }}
        onPointerUp={(e) => {
          const wasClick = drag.current && !drag.current.moved;
          drag.current = null;
          if (wasClick) {
            const id = pick(e.clientX, e.clientY);
            if (id) onSelect(id);
          }
        }}
        onPointerLeave={() => {
          drag.current = null;
          setHoverId(null);
        }}
        onWheel={(e) => {
          e.preventDefault();
          zoomBy(e.deltaY < 0 ? 1.12 : 0.9);
        }}
        onKeyDown={(e) => {
          const step = 0.12;
          if (e.key === "ArrowLeft") setView((v) => ({ ...v, yaw: v.yaw - step }));
          else if (e.key === "ArrowRight") setView((v) => ({ ...v, yaw: v.yaw + step }));
          else if (e.key === "ArrowUp") setView((v) => ({ ...v, pitch: Math.max(-1.25, v.pitch - step) }));
          else if (e.key === "ArrowDown") setView((v) => ({ ...v, pitch: Math.min(1.25, v.pitch + step) }));
          else if (e.key === "+" || e.key === "=") zoomBy(1.12);
          else if (e.key === "-") zoomBy(0.9);
          else return;
          e.preventDefault();
        }}
      />

      {/* view controls */}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button onClick={() => zoomBy(1.15)} aria-label="Zoom in" className="rounded-lg border border-line bg-white/90 p-1.5 text-slatey-300 shadow-card hover:text-ink">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => zoomBy(0.87)} aria-label="Zoom out" className="rounded-lg border border-line bg-white/90 p-1.5 text-slatey-300 shadow-card hover:text-ink">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setView({ ...HOME })} aria-label="Reset view" className="rounded-lg border border-line bg-white/90 p-1.5 text-slatey-300 shadow-card hover:text-ink">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* hover document card (HTML overlay, house tokens) */}
      {hovered && hoverPt && (
        <div
          className="pointer-events-none absolute z-10 w-52 rounded-lg border border-line bg-white p-2.5 shadow-cardhover"
          style={{
            left: Math.min(Math.max(hoverPt.sx - 104, 8), (wrapRef.current?.clientWidth ?? 300) - 216),
            top: Math.max(hoverPt.sy - hoverPt.r - 92, 8),
          }}
        >
          <p className="truncate font-mono text-[11px] font-medium text-ink">{hovered.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge color={hovered.gate.color}>{hovered.gate.gate}</Badge>
            <span className="font-mono text-[10px] text-slatey-400">score {hovered.score} · {hovered.tokens.toLocaleString()} tok</span>
          </div>
          <p className="mt-1 text-[10px] text-slatey-500">
            {piiHits(hovered) > 0 ? `PII inside · ` : ""}{isStale(hovered) ? "stale version · " : ""}click to inspect
          </p>
        </div>
      )}

      <p className="mt-1.5 text-[10px] text-slatey-500">
        Static view · drag to orbit · scroll or +/− to zoom · click a document to inspect · same PCA axes as the 2D map, third component adds depth.
      </p>
    </div>
  );
}
