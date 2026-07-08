"use client";

import { useEffect, useRef, useState } from "react";
import type { CorpusFile, DupPair } from "@data/lib/prep/corpus";

// Corpus Atlas · 3D view (Phase 3). House-built canvas renderer in the same
// spirit as Build's embedding projector: perspective projection of the three
// principal components, slow auto-orbit (disabled under reduced motion),
// drag to rotate, click to select. No new dependencies.

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

const piiHits = (f: CorpusFile): number => f.report.pii.reduce((a, b) => a + b.count, 0);
const isStale = (f: CorpusFile): boolean => {
  const c = f.report.checks.find((x) => x.guideline === "freshness");
  return !!c && c.level !== "healthy";
};

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
  const angle = useRef({ yaw: 0.6, pitch: 0.35 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const screenPts = useRef<Map<string, { sx: number; sy: number; r: number }>>(new Map());

  useEffect(() => {
    hoverRef.current = hoverId;
  }, [hoverId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    let raf = 0;
    let disposed = false;

    const maxTokens = Math.max(...files.map((f) => f.tokens), 1);
    const byId = new Map(files.map((f) => [f.id, f]));
    // Normalize stored 0..100 axes to −1..1 around the center.
    const pts = files.map((f) => ({ f, p: [(f.x - 50) / 42, (f.y - 50) / 42, (f.z - 50) / 42] as const }));

    const draw = () => {
      if (disposed) return;
      const W = wrap.clientWidth;
      const H = Math.max(240, Math.round(W * 0.72));
      if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const { yaw, pitch } = angle.current;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const cam = 3.1;
      const scale = Math.min(W, H) * 0.42;

      const proj = (v: readonly [number, number, number]) => {
        // yaw around Y, then pitch around X, then perspective
        const x1 = v[0] * cy + v[2] * sy;
        const z1 = -v[0] * sy + v[2] * cy;
        const y2 = v[1] * cp - z1 * sp;
        const z2 = v[1] * sp + z1 * cp;
        const w = cam / (cam - z2);
        return { sx: W / 2 + x1 * w * scale, sy: H / 2 - y2 * w * scale, w };
      };

      // edges first
      for (const p of pairs) {
        const a = byId.get(p.aId);
        const b = byId.get(p.bId);
        if (!a || !b) continue;
        const pa = proj([(a.x - 50) / 42, (a.y - 50) / 42, (a.z - 50) / 42]);
        const pb = proj([(b.x - 50) / 42, (b.y - 50) / 42, (b.z - 50) / 42]);
        ctx.strokeStyle = EDGE_HEX[p.kind];
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = p.kind === "near-duplicate" ? 0.8 : 1.3;
        ctx.setLineDash(p.kind === "stale-version" ? [4, 3] : []);
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // dots (far → near for painter's order)
      const drawn = pts
        .map(({ f, p }) => ({ f, s: proj(p) }))
        .sort((a, b) => a.s.w - b.s.w);
      screenPts.current.clear();
      for (const { f, s } of drawn) {
        const active = f.id === (hoverRef.current ?? selectedId);
        const base = 3 + 4 * Math.sqrt(f.tokens / maxTokens);
        const r = base * s.w * (active ? 1.35 : 1);
        ctx.globalAlpha = isStale(f) && !active ? 0.5 : 1;
        if (piiHits(f) > 0) {
          ctx.strokeStyle = "#f43f5e";
          ctx.lineWidth = 1;
          ctx.setLineDash([2.5, 2]);
          ctx.beginPath();
          ctx.arc(s.sx, s.sy, r + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = GATE_HEX[f.gate.color] ?? "#64748b";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        screenPts.current.set(f.id, { sx: s.sx, sy: s.sy, r: Math.max(r, 6) });
        if (active) {
          ctx.fillStyle = "#152433";
          ctx.font = "10px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillText(f.name.length > 28 ? f.name.slice(0, 26) + "…" : f.name, s.sx, s.sy - r - 6);
        }
      }

      if (!reduceMotion && !drag.current && !hoverRef.current) angle.current.yaw += 0.0035;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, pairs, selectedId]);

  const pick = (clientX: number, clientY: number): string | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: { id: string; d: number } | null = null;
    for (const [id, p] of screenPts.current) {
      const d = Math.hypot(p.sx - x, p.sy - y);
      if (d <= p.r + 4 && (!best || d < best.d)) best = { id, d };
    }
    return best?.id ?? null;
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="3D corpus atlas: documents positioned by content similarity; drag to rotate, click a dot to inspect its file"
        className="w-full cursor-grab rounded-xl border border-line bg-gradient-to-br from-slate-50 to-white active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            angle.current.yaw += (e.clientX - drag.current.x) * 0.008;
            angle.current.pitch = Math.max(-1.2, Math.min(1.2, angle.current.pitch + (e.clientY - drag.current.y) * 0.006));
            drag.current = { x: e.clientX, y: e.clientY };
          } else {
            setHoverId(pick(e.clientX, e.clientY));
          }
        }}
        onPointerUp={(e) => {
          const wasDrag = drag.current !== null;
          drag.current = null;
          if (!wasDrag) return;
        }}
        onPointerLeave={() => {
          drag.current = null;
          setHoverId(null);
        }}
        onClick={(e) => {
          const id = pick(e.clientX, e.clientY);
          if (id) onSelect(id);
        }}
      />
      <p className="mt-1.5 text-[10px] text-slatey-500">Drag to rotate · click a document to inspect it · same PCA axes as the 2D map, third component adds depth.</p>
    </div>
  );
}
