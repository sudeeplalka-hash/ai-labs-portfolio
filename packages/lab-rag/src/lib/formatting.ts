import type { Status } from "@rag/types";

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export function formatCurrency(value: number, digits = 3): string {
  return `$${value.toFixed(digits)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDelta(value: number, unit = ""): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${unit}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Determine a Status band for "higher is better" metrics against a target.
export function statusFromScore(value: number, target: number): Status {
  if (value >= target) return "Healthy";
  if (value >= target - 5) return "Watch";
  if (value >= target - 12) return "At Risk";
  return "Critical";
}

// Determine a Status band for "lower is better" metrics (e.g. risk, latency).
export function statusFromRiskValue(value: number, target: number): Status {
  if (value <= target) return "Healthy";
  if (value <= target * 1.15) return "Watch";
  if (value <= target * 1.4) return "At Risk";
  return "Critical";
}
