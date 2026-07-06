// Inference cost engine (GAP-06 Token Simulator, C3-3 Forecaster). Pure unit economics of a
// prompt workload: per-call cost with prompt-caching applied to the cacheable input share and
// an optional async batch discount, projected to monthly; the same workload priced across
// models (the model-swap decision); and the savings ladder (list → +cache → +batch). The
// point is the SHAPE of the economics, not the third decimal — so prices are inputs, tested.
export interface ModelRate {
  id: string;
  inputPerMTok: number;
  outputPerMTok: number;
  cachedInputPerMTok?: number;
}
export interface CallSpec {
  inputTokens: number;
  outputTokens: number;
}
export interface CostLevers {
  cache: boolean;
  cacheShare: number;   // 0..1 of input that is cacheable static context
  batch: boolean;
  batchShare: number;   // 0..1 of volume eligible for async batch
  batchDiscount?: number; // default 0.5
}

/** Cost of a single call in USD. Caching reprices the cacheable share of input at the model's
 *  cache-read rate; the batch discount applies to the batch-eligible share of total cost. */
export function callCost(rate: ModelRate, spec: CallSpec, levers: CostLevers): number {
  const cacheRatio = rate.cachedInputPerMTok !== undefined ? rate.cachedInputPerMTok / rate.inputPerMTok : 1;
  const effInputPerM =
    levers.cache && rate.cachedInputPerMTok !== undefined
      ? rate.inputPerMTok * (1 - levers.cacheShare * (1 - cacheRatio))
      : rate.inputPerMTok;
  const input = (spec.inputTokens / 1e6) * effInputPerM;
  const output = (spec.outputTokens / 1e6) * rate.outputPerMTok;
  const gross = input + output;
  const disc = levers.batch ? levers.batchShare * (levers.batchDiscount ?? 0.5) : 0;
  return gross * (1 - disc);
}

export const monthlyCost = (perCall: number, callsPerDay: number, days = 30): number => perCall * callsPerDay * days;

export interface ModelCostRow {
  id: string;
  perCall: number;
  monthly: number;
}
/** Price a workload across models, cheapest per-call first. */
export function compareModels(rates: ModelRate[], spec: CallSpec, levers: CostLevers, callsPerDay: number, days = 30): ModelCostRow[] {
  return rates
    .map((r) => {
      const perCall = callCost(r, spec, levers);
      return { id: r.id, perCall, monthly: monthlyCost(perCall, callsPerDay, days) };
    })
    .sort((a, b) => a.perCall - b.perCall);
}

export interface CostStep {
  label: string;
  monthly: number;
  savedPct: number; // vs the list-price step
}
/** Savings ladder: list price → + prompt cache → + batch, monthly cost at each cumulative step. */
export function savingsLadder(rate: ModelRate, spec: CallSpec, levers: CostLevers, callsPerDay: number, days = 30): CostStep[] {
  const at = (l: CostLevers) => monthlyCost(callCost(rate, spec, l), callsPerDay, days);
  const base = at({ cache: false, cacheShare: 0, batch: false, batchShare: 0 });
  const cache = at({ ...levers, batch: false, batchShare: 0 });
  const both = at(levers);
  const pct = (v: number) => (base > 0 ? Math.round((1 - v / base) * 100) : 0);
  return [
    { label: "List price", monthly: base, savedPct: 0 },
    { label: "+ prompt cache", monthly: cache, savedPct: pct(cache) },
    { label: "+ batch", monthly: both, savedPct: pct(both) },
  ];
}
