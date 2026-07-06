"use client";

import { type ReactNode, type Ref } from "react";
import { scatterLayout, type ScatterLayout } from "../lib/scatter";

// Reusable scatter chart built on the tested `scatterLayout` geometry. Handles the chart
// chrome (axes, gridlines, ticks, optional quadrant split) and the points (per-point size /
// color / selection). Bespoke overlays — quadrant labels, hover cards — are supplied via the
// `overlay` render-prop, which receives the layout so a caller can position in the same space.
export interface ScatterPoint {
  x: number;
  y: number;
  r?: number;
  color?: string;
  id?: string;
}
export interface ScatterPlotProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  padding?: { l?: number; r?: number; t?: number; b?: number };
  xDomain: [number, number];
  yDomain: [number, number];
  xScale?: "linear" | "log";
  yScale?: "linear" | "log";
  fmtY?: (v: number) => string;
  yTickCount?: number;
  quadrants?: boolean;
  selectedId?: string | null;
  hoverId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  ariaLabel?: string;
  svgRef?: Ref<SVGSVGElement>;
  xLabelLeft?: string;
  xLabelRight?: string;
  overlay?: (layout: ScatterLayout) => ReactNode;
}

export function ScatterPlot(props: ScatterPlotProps) {
  const W = props.width ?? 520;
  const H = props.height ?? 320;
  const padL = props.padding?.l ?? 46;
  const padR = props.padding?.r ?? 16;
  const padT = props.padding?.t ?? 26;
  const padB = props.padding?.b ?? 34;
  const layout = scatterLayout(props.data, {
    width: W, height: H, padL, padR, padT, padB,
    xDomain: props.xDomain, yDomain: props.yDomain,
    xScale: props.xScale, yScale: props.yScale, yTickCount: props.yTickCount,
  });
  const { plot } = layout;
  const midX = (plot.left + plot.right) / 2;
  const midY = (plot.top + plot.bottom) / 2;
  const fmtY = props.fmtY ?? ((v: number) => `${v}`);
  return (
    <svg ref={props.svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={props.ariaLabel ?? "Scatter plot"}>
      {props.quadrants && (
        <>
          <line x1={midX} y1={plot.top} x2={midX} y2={plot.bottom} stroke="#e4e7eb" strokeDasharray="3 3" />
          <line x1={plot.left} y1={midY} x2={plot.right} y2={midY} stroke="#e4e7eb" strokeDasharray="3 3" />
        </>
      )}
      {layout.yTicks.map((t) => (
        <g key={t.value}>
          <line x1={plot.left} y1={t.px} x2={plot.right} y2={t.px} stroke="#f1f4f7" />
          <text x={plot.left - 6} y={t.px + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtY(t.value)}</text>
        </g>
      ))}
      <line x1={plot.left} y1={plot.bottom} x2={plot.right} y2={plot.bottom} stroke="#cbd2d9" />
      <line x1={plot.left} y1={plot.top} x2={plot.left} y2={plot.bottom} stroke="#cbd2d9" />
      {props.xLabelLeft && <text x={plot.left} y={plot.bottom + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">{props.xLabelLeft}</text>}
      {props.xLabelRight && <text x={plot.right} y={plot.bottom + 16} textAnchor="end" fontSize="9" fill="#94a3b8">{props.xLabelRight}</text>}
      {props.data.map((d, i) => {
        const p = layout.placed[i];
        const on = d.id != null && d.id === props.selectedId;
        const hv = d.id != null && d.id === props.hoverId;
        return (
          <circle key={d.id ?? i} cx={p.x} cy={p.y} r={d.r ?? 4}
            fill={d.color ?? "#0d9488"} fillOpacity={on || hv ? 0.9 : 0.7}
            stroke={on ? "#152433" : "#fff"} strokeWidth={on ? 2 : 1}
            style={{ cursor: props.onSelect ? "pointer" : undefined }}
            onClick={props.onSelect && d.id != null ? () => props.onSelect!(d.id!) : undefined}
            onMouseEnter={props.onHover && d.id != null ? () => props.onHover!(d.id!) : undefined}
            onMouseLeave={props.onHover ? () => props.onHover!(null) : undefined} />
        );
      })}
      {props.overlay?.(layout)}
    </svg>
  );
}
