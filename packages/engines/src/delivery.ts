// Delivery health & RAID (EL-04). A steering board should report trajectory, not a snapshot:
// pair each workstream's reported RAG with its ACTUAL health and trend, and surface the ones
// that "read green but are sinking" — reported green while actual is worse, or green trending
// down. Plus the portfolio health rollup. Pure; the same numbers the radar shows.
export type Rag = "green" | "amber" | "red";
export type TrendDir = "up" | "flat" | "down";
export interface WorkstreamHealth {
  id: string;
  reported: Rag;
  actual: Rag;
  trend: TrendDir;
}
const RAG_SCORE: Record<Rag, number> = { green: 100, amber: 60, red: 25 };

export interface DeliveryHealth {
  index: number;  // 0..100, actual health with trend priced in via the RAG
  atRisk: number; // workstreams whose actual is not green
  gaps: number;   // workstreams where reported != actual (the reporting gap)
}
export function deliveryHealth(ws: WorkstreamHealth[]): DeliveryHealth {
  const index = ws.length ? Math.round(ws.reduce((a, w) => a + RAG_SCORE[w.actual], 0) / ws.length) : 100;
  return {
    index,
    atRisk: ws.filter((w) => w.actual !== "green").length,
    gaps: ws.filter((w) => w.reported !== w.actual).length,
  };
}

export type SinkReason = "reads-green-actually-worse" | "green-trending-down";
export interface SinkingFlag {
  id: string;
  reason: SinkReason;
}
/** Workstreams that report green but hide trouble: actual is worse than reported, or the trend
 *  is down. These are exactly what a RAG snapshot conceals. */
export function sinkingGreen(ws: WorkstreamHealth[]): SinkingFlag[] {
  return ws
    .filter((w) => w.reported === "green" && (w.actual !== "green" || w.trend === "down"))
    .map((w) => ({ id: w.id, reason: w.actual !== "green" ? "reads-green-actually-worse" : "green-trending-down" }));
}
