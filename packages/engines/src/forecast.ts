// Inference run-rate forecast (C3-3). The API bill scales linearly with compounding volume;
// self-host is fixed capacity that steps up in cluster-sized jumps. Projecting both over a
// horizon exposes the crossover, the month self-host starts winning, which is the whole
// build versus buy-at-scale argument. Pure; the same series the chart plots, so they can't drift.
export interface ForecastParams {
  startVol: number;        // calls/month at month 0
  growthPct: number;       // monthly growth %
  tokensPerCall: number;
  frontierShare: number;   // % of volume on the frontier model (blends the price)
  utilPct: number;         // cluster utilization %
  opsFte: number;          // FTEs to run self-host
  cheapPrice: number;      // $/1M tokens (cheap tier)
  frontierPrice: number;   // $/1M tokens (frontier tier)
  clusterCapTokens: number;
  clusterCost: number;     // $/month per cluster
  opsCostPerFte: number;   // $/month per FTE
  months?: number;
}
export interface Forecast {
  api: number[];
  self: number[];
  cliffMonth: number | null; // first month API > self (self-host wins); null if never
  apiCum: number;
  selfCum: number;
}
export function forecastRunRate(p: ForecastParams): Forecast {
  const months = p.months ?? 24;
  const blended = p.cheapPrice + (p.frontierShare / 100) * (p.frontierPrice - p.cheapPrice);
  const apiPerCall = (p.tokensPerCall / 1e6) * blended;
  const effCap = p.clusterCapTokens * (p.utilPct / 100);
  const api: number[] = [];
  const self: number[] = [];
  for (let m = 0; m < months; m++) {
    const vol = p.startVol * Math.pow(1 + p.growthPct / 100, m);
    const tokens = vol * p.tokensPerCall;
    api.push(vol * apiPerCall);
    const clusters = Math.max(1, Math.ceil(tokens / (effCap || 1)));
    self.push(clusters * p.clusterCost + p.opsFte * p.opsCostPerFte);
  }
  const idx = api.findIndex((a, i) => a > self[i]);
  return { api, self, cliffMonth: idx === -1 ? null : idx, apiCum: api.reduce((a, b) => a + b, 0), selfCum: self.reduce((a, b) => a + b, 0) };
}

// Which single assumption change brings the crossover forward (or into view)? Recompute the
// crossover under each proposed lever move, the biggest earlier shift is the lever that most
// favors self-host. Deterministic; delta is months earlier (negative) vs the base crossover.
export interface CliffLever {
  key: string;
  label: string;
  cliffMonth: number | null;
  delta: number | null; // vs base crossover (negative = earlier); null if either side never crosses
}
export function cliffSensitivity(base: ForecastParams, bumps: { key: keyof ForecastParams; label: string; to: number }[]): CliffLever[] {
  const baseCliff = forecastRunRate(base).cliffMonth;
  return bumps.map((b) => {
    const cliff = forecastRunRate({ ...base, [b.key]: b.to }).cliffMonth;
    const delta = cliff !== null && baseCliff !== null ? cliff - baseCliff : null;
    return { key: String(b.key), label: b.label, cliffMonth: cliff, delta };
  });
}
