/** Shared chart ink. Essential labels use text contrast, not decorative fills. */
export const CHART_TOKENS = {
  label: "#46586b",
  axis: "#616f80",
  grid: "#e4e7eb",
  selected: "#152433",
  series: ["#1f6fc4", "#0f766e", "#7e22ce", "#b45309", "#be123c", "#475569"],
} as const;

export function chartLabel(value: string): string {
  return value.replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}
