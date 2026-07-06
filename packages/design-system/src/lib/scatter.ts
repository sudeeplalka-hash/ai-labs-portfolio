// Scatter layout — pure geometry for a scatter chart: map each datum to a pixel position
// and produce the axis ticks, on linear or log scales. Built on the tested scale primitives
// so a chart component never re-derives the arithmetic. Returns the scale functions too, so
// a caller can position its own overlays (quadrant labels, hover cards) in the same space.
import { linScale, logScale, niceTicks, logTicks } from "./scale";

export interface ScatterDatum { x: number; y: number; }
export interface Tick { value: number; px: number; }
export interface ScatterLayoutOpts {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  xDomain: [number, number];
  yDomain: [number, number];
  xScale?: "linear" | "log";
  yScale?: "linear" | "log";
  xTickCount?: number;
  yTickCount?: number;
}
export interface ScatterLayout {
  placed: { x: number; y: number }[];
  xTicks: Tick[];
  yTicks: Tick[];
  plot: { left: number; right: number; top: number; bottom: number };
  toX: (v: number) => number;
  toY: (v: number) => number;
}
export function scatterLayout(data: ScatterDatum[], o: ScatterLayoutOpts): ScatterLayout {
  const left = o.padL, right = o.width - o.padR, top = o.padT, bottom = o.height - o.padB;
  const [x0, x1] = o.xDomain;
  const [y0, y1] = o.yDomain;
  const toX = (v: number) => (o.xScale === "log" ? logScale(v, x0, x1, left, right) : linScale(v, x0, x1, left, right));
  const toY = (v: number) => (o.yScale === "log" ? logScale(v, y0, y1, bottom, top) : linScale(v, y0, y1, bottom, top)); // inverted: data up → pixels down
  const placed = data.map((d) => ({ x: toX(d.x), y: toY(d.y) }));
  const xtv = o.xScale === "log" ? logTicks(x0, x1) : niceTicks(x0, x1, o.xTickCount ?? 4);
  const ytv = o.yScale === "log" ? logTicks(y0, y1) : niceTicks(y0, y1, o.yTickCount ?? 4);
  return {
    placed,
    xTicks: xtv.map((v) => ({ value: v, px: toX(v) })),
    yTicks: ytv.map((v) => ({ value: v, px: toY(v) })),
    plot: { left, right, top, bottom },
    toX,
    toY,
  };
}
