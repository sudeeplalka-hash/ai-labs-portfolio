"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface ProjPoint {
  chunkId: string;
  x: number;
  y: number;
  z: number;
  color: string;
  section: string;
  preview: string;
  retrieved: boolean;
  usedInAnswer: boolean;
  citationLabel?: string;
  relevance?: number;
  label?: string; // shown on-canvas in keyword mode
}

export interface ClusterLabel {
  text: string;
  color: string;
  x: number;
  y: number;
  z: number;
}

interface Props {
  points: ProjPoint[];
  query: { x: number; y: number; z: number } | null;
  clusterLabels?: ClusterLabel[];
  height?: number;
}

const INK = "#152433";
const AXIS = "#33485f";
const GRID = "#dde3ea";
const PULSE_PERIOD = 1300; // ms for one chunk -> query traversal

type CardState = { p: ProjPoint; x: number; y: number; pinned: boolean } | null;

// Light, editorial 3D scatter (no glow): navy axes, soft grid, flat dots, labels.
// "Polished & calm": soft radial backdrop, retrieved halos, a gently pulsing query
// marker, and pulses that travel along each beam from a retrieved chunk to the query.
// Hover to inspect on desktop; tap a point to pin an expanded card on mobile.
export function EmbeddingProjector3D({ points, query, clusterLabels = [], height = 440 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const rot = useRef({ x: -0.5, y: 0.78 });
  const vel = useRef({ x: 0, y: 0 });
  const zoom = useRef(1);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const downPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const screens = useRef<{ i: number; sx: number; sy: number }[]>([]);
  const appearStart = useRef(0);
  const hoverRef = useRef(-1);
  const pinnedRef = useRef(-1);

  const [card, setCard] = useState<CardState>(null);

  const clearPin = () => {
    pinnedRef.current = -1;
    setCard((c) => (c && c.pinned ? null : c));
  };

  useEffect(() => {
    appearStart.current = performance.now();
    pinnedRef.current = -1;
    setCard(null);
  }, [points.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const reduceMotion = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      W = wrap.clientWidth;
      H = height;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const project = (p: { x: number; y: number; z: number }) => {
      const { x: rx, y: ry } = rot.current;
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const x = p.x * cy + p.z * sy;
      const z = -p.x * sy + p.z * cy;
      const y = p.y;
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const y2 = y * cx - z * sx;
      const z2 = y * sx + z * cx;
      const D = 3.4;
      const persp = D / (D - z2);
      const s = 132 * zoom.current * persp;
      return { sx: W / 2 + x * s, sy: H / 2 - y2 * s + H * 0.04, depth: z2, persp };
    };

    const line = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, color: string, w: number, alpha = 1) => {
      const pa = project(a);
      const pb = project(b);
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.lineTo(pb.sx, pb.sy);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const paintBackdrop = () => {
      const g = ctx.createRadialGradient(W / 2, H * 0.42, 12, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#f1efe9");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };

    const drawGrid = () => {
      const ticks = [-1, -0.5, 0, 0.5, 1];
      for (const t of ticks) {
        line({ x: t, y: -1, z: -1 }, { x: t, y: -1, z: 1 }, GRID, 1, 0.7);
        line({ x: -1, y: -1, z: t }, { x: 1, y: -1, z: t }, GRID, 1, 0.7);
      }
      for (const t of ticks) {
        line({ x: -1, y: -1, z: t }, { x: -1, y: 1, z: t }, GRID, 1, 0.55);
        line({ x: -1, y: t, z: -1 }, { x: -1, y: t, z: 1 }, GRID, 1, 0.55);
      }
      for (const t of ticks) {
        line({ x: t, y: -1, z: -1 }, { x: t, y: 1, z: -1 }, GRID, 1, 0.55);
        line({ x: -1, y: t, z: -1 }, { x: 1, y: t, z: -1 }, GRID, 1, 0.55);
      }
    };

    const arrow = (to: { x: number; y: number; z: number }) => {
      const o = project({ x: 0, y: 0, z: 0 });
      const t = project(to);
      ctx.strokeStyle = AXIS;
      ctx.fillStyle = AXIS;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(o.sx, o.sy);
      ctx.lineTo(t.sx, t.sy);
      ctx.stroke();
      const ang = Math.atan2(t.sy - o.sy, t.sx - o.sx);
      const ah = 8;
      ctx.beginPath();
      ctx.moveTo(t.sx, t.sy);
      ctx.lineTo(t.sx - ah * Math.cos(ang - 0.4), t.sy - ah * Math.sin(ang - 0.4));
      ctx.lineTo(t.sx - ah * Math.cos(ang + 0.4), t.sy - ah * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    const label = (text: string, sx: number, sy: number, color = INK, bold = true) => {
      ctx.font = `${bold ? "600 " : ""}12px "Public Sans", system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(248,248,246,0.9)";
      ctx.strokeText(text, sx, sy);
      ctx.fillStyle = color;
      ctx.fillText(text, sx, sy);
    };

    // A small dot riding the beam from a retrieved chunk toward the query.
    const beamPulse = (from: { sx: number; sy: number }, to: { sx: number; sy: number }, color: string, u: number) => {
      // Three-dot comet: leading dot at u plus two fading trail dots behind it.
      for (let k = 0; k < 3; k++) {
        const uu = u - k * 0.055;
        if (uu < 0 || uu > 1) continue;
        const px = from.sx + (to.sx - from.sx) * uu;
        const py = from.sy + (to.sy - from.sy) * uu;
        const fade = (1 - k * 0.4) * Math.sin(Math.min(1, uu) * Math.PI); // fade in/out at the ends
        if (fade <= 0) continue;
        // soft halo
        ctx.globalAlpha = 0.16 * fade;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 4.4 - k, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.arc(px, py, 2.3 - k * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      const now = performance.now();
      const appear = Math.min(1, (now - appearStart.current) / 800);
      const ease = 1 - Math.pow(1 - appear, 3);

      // Auto-rotate unless dragging or a point is pinned (so the card stays put).
      if (!dragging.current && pinnedRef.current < 0) {
        rot.current.y += vel.current.y + (reduceMotion ? 0 : 0.0014);
        rot.current.x += vel.current.x;
        vel.current.x *= 0.92;
        vel.current.y *= 0.92;
        rot.current.x = Math.max(-1.1, Math.min(0.2, rot.current.x));
      }

      paintBackdrop();
      drawGrid();
      arrow({ x: 1.25, y: 0, z: 0 });
      arrow({ x: 0, y: 1.25, z: 0 });
      arrow({ x: 0, y: 0, z: 1.25 });

      const qScreen = query ? project(query) : null;
      const sc0 = points.map((p) => project({ x: p.x * ease, y: p.y * ease, z: p.z * ease }));

      // Static beams from the query to every retrieved chunk.
      if (qScreen) {
        ctx.strokeStyle = "rgba(21,36,51,0.14)";
        ctx.lineWidth = 1;
        points.forEach((p, i) => {
          if (!p.retrieved) return;
          ctx.beginPath();
          ctx.moveTo(qScreen.sx, qScreen.sy);
          ctx.lineTo(sc0[i].sx, sc0[i].sy);
          ctx.stroke();
        });
        // Pulses travelling from each retrieved chunk to the query.
        if (!reduceMotion) {
          points.forEach((p, i) => {
            if (!p.retrieved) return;
            const u = ((now / PULSE_PERIOD) + i * 0.17) % 1;
            beamPulse(sc0[i], qScreen, p.color, u * ease);
          });
        }
      }

      const sc = points
        .map((p, i) => ({ i, ...project({ x: p.x * ease, y: p.y * ease, z: p.z * ease }) }))
        .sort((a, b) => a.depth - b.depth);
      screens.current = sc.map((s) => ({ i: s.i, sx: s.sx, sy: s.sy }));

      for (const s of sc) {
        const p = points[s.i];
        const active = hoverRef.current === s.i || pinnedRef.current === s.i;
        const depthT = (s.depth + 1) / 2;
        const baseR = (p.retrieved ? 6 : 3.4) + depthT * 2 + (active ? 2 : 0);
        // Soft halo behind retrieved points (calm, no glow).
        if (p.retrieved || active) {
          ctx.globalAlpha = (active ? 0.22 : 0.16) * ease;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(s.sx, s.sy, baseR + (active ? 7 : 5), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = (0.55 + 0.4 * depthT) * ease;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, baseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.retrieved || active) {
          ctx.strokeStyle = p.usedInAnswer ? INK : "rgba(21,36,51,0.55)";
          ctx.lineWidth = p.usedInAnswer ? 2 : 1.3;
          ctx.beginPath();
          ctx.arc(s.sx, s.sy, baseR + 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // On-canvas labels: keyword labels (keyword mode) and retrieved citation labels.
      for (const s of sc) {
        const p = points[s.i];
        if (p.label) label(p.label, s.sx + 8, s.sy - 8);
        else if (p.retrieved && p.citationLabel) label(p.citationLabel, s.sx + 9, s.sy - 9);
      }

      for (const cl of clusterLabels) {
        const ps = project({ x: cl.x * ease, y: cl.y * ease, z: cl.z * ease });
        ctx.fillStyle = cl.color;
        ctx.beginPath();
        ctx.arc(ps.sx - 7, ps.sy, 3, 0, Math.PI * 2);
        ctx.fill();
        label(cl.text, ps.sx + 2, ps.sy, INK, true);
      }

      if (qScreen) {
        // Gentle radar pulse around the query marker.
        if (!reduceMotion) {
          const ph = (now / 1500) % 1;
          ctx.globalAlpha = 0.3 * (1 - ph);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(qScreen.sx, qScreen.sy, 5.5 + ph * 11, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = INK;
        ctx.fillStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(qScreen.sx, qScreen.sy, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        label("query", qScreen.sx + 9, qScreen.sy + 2, INK);
      }

      // Keep a pinned card aligned to its point.
      if (pinnedRef.current >= 0) {
        const s = screens.current.find((x) => x.i === pinnedRef.current);
        if (s) setCard((c) => (c && c.pinned && (Math.abs(c.x - s.sx) > 1 || Math.abs(c.y - s.sy) > 1) ? { ...c, x: s.sx, y: s.sy } : c));
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const pickAt = (mx: number, my: number) => {
      let best = -1;
      let bestD = 18 * 18;
      for (const s of screens.current) {
        const dx = s.sx - mx;
        const dy = s.sy - my;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = s.i;
        }
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      moved.current = false;
      last.current = { x: e.clientX, y: e.clientY };
      downPos.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (dragging.current) {
        const dist = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y);
        if (dist > 6) {
          moved.current = true;
          clearPin();
        }
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
        rot.current.y += dx * 0.01;
        rot.current.x += dy * 0.01;
        rot.current.x = Math.max(-1.1, Math.min(0.2, rot.current.x));
        vel.current = { x: dy * 0.01, y: dx * 0.01 };
        hoverRef.current = -1;
        if (!pinnedRef.current && pinnedRef.current < 0) setCard(null);
      } else {
        const idx = pickAt(mx, my);
        hoverRef.current = idx;
        if (pinnedRef.current < 0) setCard(idx >= 0 ? { p: points[idx], x: mx, y: my, pinned: false } : null);
      }
    };
    const onUp = (e: PointerEvent) => {
      dragging.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      if (!moved.current) {
        const rect = canvas.getBoundingClientRect();
        const idx = pickAt(e.clientX - rect.left, e.clientY - rect.top);
        if (idx >= 0) {
          pinnedRef.current = idx;
          const s = screens.current.find((x) => x.i === idx);
          setCard({ p: points[idx], x: s?.sx ?? 0, y: s?.sy ?? 0, pinned: true });
        } else {
          clearPin();
        }
      }
    };
    const onLeave = () => {
      hoverRef.current = -1;
      if (pinnedRef.current < 0) setCard(null);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current = Math.max(0.6, Math.min(2.6, zoom.current * (e.deltaY > 0 ? 0.92 : 1.08)));
      clearPin();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, query, clusterLabels, height]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-xl border border-line bg-[#faf9f6]" style={{ height }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`3D embedding map of ${points.length} points positioned by similarity; retrieved items for the latest question are highlighted and labeled.`}
        className="block cursor-grab touch-none active:cursor-grabbing"
      />
      {card && (
        <div
          className="absolute z-10 max-w-[260px] rounded-lg border border-line bg-white p-2.5 text-xs shadow-card"
          style={{
            left: Math.max(8, Math.min(card.x + 12, (wrapRef.current?.clientWidth ?? 9999) - 12)),
            top: Math.min(card.y + 12, height - 12),
            transform: card.x > 220 ? "translateX(-100%)" : undefined,
            pointerEvents: card.pinned ? "auto" : "none",
          }}
        >
          {card.pinned && (
            <button onClick={clearPin} className="absolute right-1.5 top-1.5 rounded p-0.5 text-slatey-400 hover:bg-slate-100 hover:text-ink" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="mb-1 flex items-center gap-1.5 pr-4">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: card.p.color }} />
            <span className="font-semibold text-ink">{card.p.section}</span>
            {card.p.retrieved && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{card.p.citationLabel ?? "match"}</span>
            )}
          </div>
          <p className="line-clamp-4 leading-relaxed text-slatey-300">{card.p.preview}</p>
          {card.p.relevance !== undefined && card.p.retrieved && (
            <p className="mt-1 text-[10px] text-slatey-500">relevance {card.p.relevance.toFixed(2)}</p>
          )}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-slatey-500">drag to orbit · pinch/scroll to zoom · tap a point</div>
    </div>
  );
}
