// Dated pricing data for cost labs (GAP-06 token simulator, C3 #3 forecaster).
// USD per 1M tokens. Illustrative published list prices — every cost lab shows an
// "as of" stamp and lets the visitor edit assumptions (§A4.3, no black-box numbers).
// Refresh on the quarterly sweep (B5.6).

export const PRICING_AS_OF = "2026-07-02";

export interface ModelPrice {
  id: string; // matches MODEL_CATALOG id
  inputPerMTok: number; // USD / 1M input tokens
  outputPerMTok: number; // USD / 1M output tokens
  cachedInputPerMTok?: number; // prompt-cache read price, if offered
}

// Numbers are plausible illustrative list prices, not a live quote. The point of
// the lab is the *shape* of the economics (caching/batching leverage), not the
// third decimal — which is why they're editable in-lab.
export const MODEL_PRICING: ModelPrice[] = [
  { id: "claude-sonnet-5", inputPerMTok: 3.0, outputPerMTok: 15.0, cachedInputPerMTok: 0.3 },
  { id: "claude-opus-4-8", inputPerMTok: 15.0, outputPerMTok: 75.0, cachedInputPerMTok: 1.5 },
  { id: "claude-haiku-4-5", inputPerMTok: 0.8, outputPerMTok: 4.0, cachedInputPerMTok: 0.08 },
  { id: "gpt-4o", inputPerMTok: 2.5, outputPerMTok: 10.0, cachedInputPerMTok: 1.25 },
  { id: "gpt-4o-mini", inputPerMTok: 0.15, outputPerMTok: 0.6, cachedInputPerMTok: 0.075 },
  { id: "gemini-1.5-pro", inputPerMTok: 1.25, outputPerMTok: 5.0 },
  { id: "gemini-1.5-flash", inputPerMTok: 0.075, outputPerMTok: 0.3 },
];

export function modelPrice(id: string): ModelPrice | undefined {
  return MODEL_PRICING.find((m) => m.id === id);
}

// Leverage assumptions the cost labs expose as toggles. Cache discount is applied
// to the cacheable share of input; batch discount to eligible async volume.
export const COST_LEVERS = {
  promptCacheReadDiscount: 0.9, // ~90% cheaper on cache hits (see cachedInputPerMTok)
  batchDiscount: 0.5, // ~50% off for async batch-eligible workloads
} as const;
