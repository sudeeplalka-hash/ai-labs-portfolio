"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { CorpusFile, DupPair } from "@data/lib/prep/corpus";
import type { AtlasHull } from "./CorpusStarMap";
import { Badge } from "@data/components/common/Badge";

// Corpus Atlas · 3D view. Analyst-console grammar: the scene is STATIC until
// the user acts — no autoplay, no motion for its own sake. Drag orbits, wheel
// or buttons zoom, double-click resets, hover raises a document card, click
// selects a document or opens a linked pair's resolution set. Depth is carried
// by a gridded room — the floor plus whichever walls face away from you, so
// the cube reads as a space you look into from any angle — with shadows and
// distance attenuation. The only motion is a sonar pulse on the hovered
// document (skipped under prefers-reduced-motion). Honest axes: the SAME PCA
// space as the 2D map — PC1/PC2 match it, PC3 adds the third component.
// Confirmed topic groups draw as hulls here too, so both views tell one story.

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
const EDGE_LABEL: Record<DupPair["kind"], string> = {
  duplicate: "Duplicate",
  "stale-version": "Stale version",
  "near-duplicate": "Near-duplicate",
};
const LEGEND_GATES: [string, string][] = [
  ["Approved", "emerald"],
  ["Conditional", "amber"],
  ["Hold", "orange"],
  ["Rejected", "rose"],
];
const INK = "#152433";
const LINE = "rgba(21,36,51,0.08)";
const LINE_SOFT = "rgba(21,36,51,0.05)";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

const piiHits = (f: CorpusFile): number => f.report.pii.reduce((a, b) => a + b.count, 0);
const isStale = (f: CorpusFile): boolean => {
  const c = f.report.checks.find((x) => x.guideline === "freshness");
  return !!c && c.level !== "healthy";
};

// Monotone-chain convex hull in screen space (tiny n, deterministic) — the 3D
// twin of the Star Map's topic outlines, computed over projected coordinates.
function hull2d(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  if (pts.length < 3) return pts;
  const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: { x: number; y: number }[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: { x: number; y: number }[] = [];
  for (const pt of p.slice().reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const HOME = { yaw: 0.62, pitch: 0.34, zoom: 1 };

interface EdgeHit {
  i: number;
  mx: number;
  my: number;
}

export function CorpusAtlas3D({
  files,
  pairs,
  selectedId,
  onSelect,
  hulls = [],
  onEdgeClick,
}: {
  files: CorpusFile[];
  pairs: DupPair[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hulls?: AtlasHull[];
  onEdgeClick?: (p: DupPair) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<EdgeHit | null>(null);
  const [view, setView] = useState({ ...HOME });
  const [sizeTick, setSizeTick] = useState(0);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const screenPts = useRef<Map<string, { sx: number; sy: number; r: number; fade: number }>>(new Map());
  const screenSegs = useRef<{ i: number; x1: number; y1: number; x2: number; y2: number }[]>([]);

  // One draw per state change. While a document is hovered (and the user
  // hasn't asked for reduced motion) a bounded rAF loop replays the same
  // deterministic frame with only the pulse phase advancing.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    void sizeTick; // re-render when the wrapper resizes (grid breakpoints)
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const W = wrap.clientWidth;
    const H = Math.max(300, Math.min(520, Math.round(W * 0.72)));
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const { yaw, pitch, zoom } = view;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cam = 3.2;

    // Per-corpus normalization: center the cloud on its midrange and divide by
    // the dominant half-range (uniform, so relative geometry is preserved).
    const axes = (["x", "y", "z"] as const).map((k) => {
      let lo = Infinity;
      let hi = -Infinity;
      for (const f of files) {
        lo = Math.min(lo, f[k]);
        hi = Math.max(hi, f[k]);
      }
      return { mid: (lo + hi) / 2, half: (hi - lo) / 2 };
    });
    const half = Math.max(axes[0].half, axes[1].half, axes[2].half, 1e-6);
    const npos = new Map(
      files.map((f) => [
        f.id,
        { x: (f.x - axes[0].mid) / half, y: (f.y - axes[1].mid) / half, z: (f.z - axes[2].mid) / half },
      ]),
    );

    // Auto-fit: scale from the cloud's bounding sphere, so no document can
    // leave the frame at ANY orbit angle. Rotation preserves distance from the
    // origin; the worst perspective magnification happens at the nearest depth.
    let R = 0.35;
    let E = 0.35;
    for (const p of npos.values()) {
      R = Math.max(R, Math.hypot(p.x, p.y, p.z));
      E = Math.max(E, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
    }
    const wmax = cam / (cam - Math.min(R, cam - 0.6));
    const pad = 12 * wmax + 22; // max dot radius + PII ring + breathing room
    const scale = (Math.max(60, Math.min(W, H) / 2 - pad) / (R * wmax)) * zoom;

    const proj = (x: number, y: number, z: number) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const w = cam / (cam - z2);
      return { sx: W / 2 + x1 * w * scale, sy: H / 2 - y2 * w * scale, w };
    };
    // View-space depth only (for choosing which cube walls face away).
    const depthOf = (x: number, y: number, z: number) => {
      const z1 = -x * sy + z * cy;
      return y * sp + z1 * cp;
    };

    const G = Math.max(0.55, E * 1.12);
    const byId = new Map(files.map((f) => [f.id, f]));
    const maxTokens = Math.max(...files.map((f) => f.tokens), 1);

    const draw = (pulse: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // ---- the room: floor grid + grids on the far walls of the cube ----
      // The two vertical walls that face away from the camera carry the grid,
      // re-chosen every orbit so the cube always reads as a room you look into.
      const line3 = (a: [number, number, number], b: [number, number, number]) => {
        const pa = proj(...a);
        const pb = proj(...b);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      };
      const wallGrid = (fix: "x" | "y" | "z", s: number) => {
        for (let i = 0; i <= 6; i++) {
          const t = -G + (2 * G * i) / 6;
          if (fix === "y") {
            line3([t, s * G, -G], [t, s * G, G]);
            line3([-G, s * G, t], [G, s * G, t]);
          } else if (fix === "x") {
            line3([s * G, t, -G], [s * G, t, G]);
            line3([s * G, -G, t], [s * G, G, t]);
          } else {
            line3([t, -G, s * G], [t, G, s * G]);
            line3([-G, t, s * G], [G, t, s * G]);
          }
        }
      };
      ctx.lineWidth = 1;
      ctx.strokeStyle = LINE_SOFT;
      const wallX = depthOf(G, 0, 0) < depthOf(-G, 0, 0) ? 1 : -1;
      const wallZ = depthOf(0, 0, G) < depthOf(0, 0, -G) ? 1 : -1;
      wallGrid("y", -1);
      wallGrid("x", wallX);
      wallGrid("z", wallZ);

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
      for (const [a, b] of boxEdges) line3(corners[a], corners[b]);

      // ---- principal-component axis labels (visible math, not decoration) ----
      ctx.font = `500 9px ${MONO}`;
      ctx.fillStyle = "rgba(21,36,51,0.4)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const axisTags: { label: string; at: [number, number, number] }[] = [
        { label: "PC1", at: [G + 0.16, -G, -G] },
        { label: "PC2", at: [-G, G + 0.16, -G] },
        { label: "PC3", at: [-G, -G, G + 0.16] },
      ];
      for (const a of axisTags) {
        const p = proj(...a.at);
        ctx.fillText(a.label, p.sx, p.sy);
      }
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      // ---- confirmed topic hulls (same groups as the 2D map) ----
      const hullLabelRects: { x: number; y: number; w: number; h: number }[] = [];
      for (const h of hulls) {
        const pts = h.memberIds
          .map((id) => npos.get(id))
          .filter((p): p is { x: number; y: number; z: number } => !!p)
          .map((p) => proj(p.x, p.y, p.z));
        if (pts.length < 2) continue;
        const cx2 = pts.reduce((a, p) => a + p.sx, 0) / pts.length;
        const cy2 = pts.reduce((a, p) => a + p.sy, 0) / pts.length;
        if (pts.length === 2) {
          ctx.strokeStyle = h.color;
          ctx.globalAlpha = 0.07;
          ctx.lineWidth = 30;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(pts[0].sx, pts[0].sy); ctx.lineTo(pts[1].sx, pts[1].sy); ctx.stroke();
          ctx.lineCap = "butt";
        } else {
          const hp = hull2d(pts.map((p) => ({ x: p.sx, y: p.sy }))).map((q) => {
            const d = Math.hypot(q.x - cx2, q.y - cy2) || 1;
            const k = 1 + 16 / d;
            return { x: cx2 + (q.x - cx2) * k, y: cy2 + (q.y - cy2) * k };
          });
          ctx.beginPath();
          hp.forEach((q, qi) => (qi === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
          ctx.closePath();
          ctx.fillStyle = h.color;
          ctx.globalAlpha = 0.055;
          ctx.fill();
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.strokeStyle = h.color;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const topY = Math.min(...pts.map((p) => p.sy));
        ctx.globalAlpha = 1;
        ctx.font = `600 10px ${SANS}`;
        ctx.textAlign = "center";
        const lw = ctx.measureText(h.label).width;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.strokeText(h.label, cx2, topY - 12);
        ctx.fillStyle = h.color;
        ctx.fillText(h.label, cx2, topY - 12);
        ctx.textAlign = "left";
        hullLabelRects.push({ x: cx2 - lw / 2, y: topY - 22, w: lw, h: 12 });
      }
      ctx.globalAlpha = 1;

      // ---- relation edges (click one to open its resolution set) ----
      screenSegs.current = [];
      pairs.forEach((pr, i) => {
        const a = byId.get(pr.aId);
        const b = byId.get(pr.bId);
        if (!a || !b) return;
        const na = npos.get(a.id);
        const nb = npos.get(b.id);
        if (!na || !nb) return;
        const pa = proj(na.x, na.y, na.z);
        const pb = proj(nb.x, nb.y, nb.z);
        const hot = hoverEdge?.i === i;
        ctx.strokeStyle = EDGE_HEX[pr.kind];
        ctx.globalAlpha = hot ? 0.9 : 0.5;
        ctx.lineWidth = (pr.kind === "near-duplicate" ? 1 : 1.4) + (hot ? 0.6 : 0);
        ctx.setLineDash(pr.kind === "stale-version" ? [5, 3] : []);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        screenSegs.current.push({ i, x1: pa.sx, y1: pa.sy, x2: pb.sx, y2: pb.sy });
      });

      // ---- documents (far → near) ----
      const drawn = files
        .map((f) => {
          const p = npos.get(f.id) ?? { x: 0, y: 0, z: 0 };
          return { f, p, s: proj(p.x, p.y, p.z) };
        })
        .sort((a, b) => a.s.w - b.s.w);
      screenPts.current.clear();
      for (const { f, p, s } of drawn) {
        const active = f.id === (hoverId ?? selectedId);
        const base = 4 + 5 * Math.sqrt(f.tokens / maxTokens);
        const r = base * s.w * (active ? 1.25 : 1);
        const depthFade = 0.55 + 0.45 * Math.min(1, Math.max(0, (s.w - 0.7) / 0.7));
        ctx.globalAlpha = (isStale(f) && !active ? 0.45 : 1) * depthFade;

        // drop hint on the floor for depth reading
        const foot = proj(p.x, -G, p.z);
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
        screenPts.current.set(f.id, { sx: s.sx, sy: s.sy, r: Math.max(r, 7), fade: depthFade });
      }

      // ---- sonar pulse on the hovered document ----
      if (hoverId && pulse > 0) {
        const pt = screenPts.current.get(hoverId);
        const hf = byId.get(hoverId);
        if (pt && hf) {
          ctx.strokeStyle = GATE_HEX[hf.gate.color] ?? INK;
          ctx.globalAlpha = (1 - pulse) * 0.45;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(pt.sx, pt.sy, pt.r + 2 + pulse * 10, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // ---- file-name labels (collision-avoided, depth-faded) ----
      const showAll = files.length <= 14;
      type LRect = { x: number; y: number; w: number; h: number };
      const placed: LRect[] = [...hullLabelRects];
      const controlsZone: LRect = { x: W - 48, y: 0, w: 48, h: 122 };
      const hits = (a: LRect, b: LRect) =>
        a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      const prio = [...drawn].reverse(); // nearest first, selected front-most
      prio.sort((a, b) => Number(b.f.id === selectedId) - Number(a.f.id === selectedId));
      ctx.font = `500 9px ${MONO}`;
      for (const { f, s } of prio) {
        const isSel = f.id === selectedId;
        if (!showAll && !isSel) continue;
        if (f.id === hoverId) continue; // the hover card already names it
        const pt = screenPts.current.get(f.id);
        if (!pt) continue;
        let name = f.name;
        if (name.length > 18) name = `${name.slice(0, 16)}…`;
        const w = ctx.measureText(name).width;
        const cand: LRect[] = [
          { x: s.sx + pt.r + 5, y: s.sy - 5, w, h: 10 },
          { x: s.sx - pt.r - 5 - w, y: s.sy - 5, w, h: 10 },
          { x: s.sx - w / 2, y: s.sy - pt.r - 15, w, h: 10 },
          { x: s.sx - w / 2, y: s.sy + pt.r + 5, w, h: 10 },
        ];
        const spot = cand.find(
          (cr) =>
            cr.x >= 3 && cr.x + cr.w <= W - 3 && cr.y >= 3 && cr.y + cr.h <= H - 4 &&
            !hits(cr, controlsZone) && !placed.some((q) => hits(cr, q)),
        );
        if (!spot) continue; // crowded spot: hover still reveals it
        placed.push(spot);
        ctx.globalAlpha = Math.min(1, pt.fade + (isSel ? 0.35 : 0));
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.strokeText(name, spot.x, spot.y + 8);
        ctx.fillStyle = isSel ? INK : "rgba(21,36,51,0.72)";
        ctx.fillText(name, spot.x, spot.y + 8);
        ctx.globalAlpha = 1;
      }
    };

    draw(0);
    canvas.style.cursor = hoverId || hoverEdge ? "pointer" : "";

    // Pulse loop: only while a document is hovered, never otherwise.
    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!hoverId || reduced) return;
    let raf = 0;
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    const loop = (t: number) => {
      draw(((t - t0) % 1200) / 1200);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [files, pairs, hulls, selectedId, hoverId, hoverEdge, view, sizeTick]);

  // Re-render on wrapper resize (the atlas card width changes with breakpoints).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setSizeTick((t) => t + 1));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom needs a native non-passive listener: React attaches wheel
  // handlers passively at the root, so preventDefault there can't stop the
  // page from scrolling while the user zooms the scene.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setView((v) => ({ ...v, zoom: Math.min(2.4, Math.max(0.5, v.zoom * (e.deltaY < 0 ? 1.12 : 0.9))) }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

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

  const pickEdge = (clientX: number, clientY: number): EdgeHit | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: { hit: EdgeHit; d: number } | null = null;
    for (const s of screenSegs.current) {
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const L2 = dx * dx + dy * dy || 1;
      let t = ((x - s.x1) * dx + (y - s.y1) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      const qx = s.x1 + t * dx;
      const qy = s.y1 + t * dy;
      const d = Math.hypot(x - qx, y - qy);
      if (d <= 7 && (!best || d < best.d)) best = { hit: { i: s.i, mx: qx, my: qy }, d };
    }
    return best?.hit ?? null;
  };

  const hovered = hoverId ? files.find((f) => f.id === hoverId) : null;
  const hoverPt = hoverId ? screenPts.current.get(hoverId) : null;
  const edgePair = hoverEdge && hoverEdge.i < pairs.length ? pairs[hoverEdge.i] : null;
  const zoomBy = (k: number) => setView((v) => ({ ...v, zoom: Math.min(2.4, Math.max(0.5, v.zoom * k)) }));
  const wrapW = wrapRef.current?.clientWidth ?? 300;

  return (
    <div ref={wrapRef} className="w-full">
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="3D corpus atlas: documents positioned by content similarity on the same PCA axes as the 2D map. Drag to orbit, scroll or use the buttons to zoom, double-click to reset, click a document to inspect it, click a relation line to open its resolution set."
          tabIndex={0}
          className="w-full cursor-grab rounded-xl border border-line bg-gradient-to-br from-slate-50 to-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY, moved: false };
            setHoverEdge(null);
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
              const id = pick(e.clientX, e.clientY);
              setHoverId(id);
              setHoverEdge(id ? null : pickEdge(e.clientX, e.clientY));
            }
          }}
          onPointerUp={(e) => {
            const wasClick = drag.current && !drag.current.moved;
            drag.current = null;
            if (wasClick) {
              const id = pick(e.clientX, e.clientY);
              if (id) {
                onSelect(id);
              } else if (onEdgeClick) {
                const eh = pickEdge(e.clientX, e.clientY);
                if (eh && eh.i < pairs.length) onEdgeClick(pairs[eh.i]);
              }
            }
          }}
          onPointerLeave={() => {
            drag.current = null;
            setHoverId(null);
            setHoverEdge(null);
          }}
          onDoubleClick={() => setView({ ...HOME })}
          onKeyDown={(e) => {
            const step = 0.12;
            if (e.key === "ArrowLeft") setView((v) => ({ ...v, yaw: v.yaw - step }));
            else if (e.key === "ArrowRight") setView((v) => ({ ...v, yaw: v.yaw + step }));
            else if (e.key === "ArrowUp") setView((v) => ({ ...v, pitch: Math.max(-1.25, v.pitch - step) }));
            else if (e.key === "ArrowDown") setView((v) => ({ ...v, pitch: Math.min(1.25, v.pitch + step) }));
            else if (e.key === "+" || e.key === "=") zoomBy(1.12);
            else if (e.key === "-") zoomBy(0.9);
            else if (e.key === "0" || e.key === "Home") setView({ ...HOME });
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
              left: Math.min(Math.max(hoverPt.sx - 104, 8), wrapW - 216),
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

        {/* relation-edge tooltip */}
        {edgePair && hoverEdge && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-line bg-white px-2 py-1 text-[10px] font-medium text-slatey-200 shadow-card"
            style={{
              left: Math.min(Math.max(hoverEdge.mx - 70, 8), wrapW - 170),
              top: Math.max(hoverEdge.my - 30, 4),
            }}
          >
            {EDGE_LABEL[edgePair.kind]} · {Math.round(edgePair.similarity * 100)}% overlap{onEdgeClick ? " · click to resolve" : ""}
          </div>
        )}
      </div>

      {/* legend: same encodings as the 2D map, stated once */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] leading-none text-slatey-500">
        {LEGEND_GATES.map(([label, c]) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GATE_HEX[c] }} />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed" style={{ borderColor: GATE_HEX.rose }} />
          PII inside
        </span>
        <span>dimmed = stale</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3.5 border-t" style={{ borderColor: EDGE_HEX.duplicate }} />
          duplicate
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3.5 border-t border-dashed" style={{ borderColor: EDGE_HEX["stale-version"] }} />
          version pair
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3.5 border-t" style={{ borderColor: EDGE_HEX["near-duplicate"] }} />
          near-dup
        </span>
      </div>

      <p className="mt-1.5 text-[10px] text-slatey-500">
        Static view · drag to orbit the room · scroll or +/− to zoom · double-click to reset · hover to pulse a
        document, click to inspect · click a relation line to resolve its set · PC1/PC2 match the 2D map, PC3 adds
        depth · confirmed topics draw as hulls in both views.
      </p>
    </div>
  );
}
