// GAP-06 · Prompt Cost & Token Simulator, use cases.
// Payload = an input preset (model + prompt + volume + caching/batching levers).
// Retail: caching the shared brand prompt is the lever. Telecom: async batch
// discount is the go/no-go. Adtech: unit economics gate the feature. Model id
// references LIVE_MODEL_CHEAP, no hardcoded model string.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";
import { LIVE_MODEL_CHEAP } from "../models";

export interface Gap06Payload {
  modelId: string;
  prompt: string;
  outTok: number;
  callsPerDay: number;
  caching: boolean;
  cacheShare: number;
  batching: boolean;
  batchShare: number;
}

export const GAP06_USE_CASES: UseCase<Gap06Payload>[] = assertUseCases<Gap06Payload>([
  {
    id: "gap06-retail-sku-copy",
    labId: "GAP-06",
    industry: "retail",
    provenance: studied,
    title: "Refresh copy for 4M SKUs",
    oneLiner: "Caching the shared brand prompt collapses the seasonal bill.",
    context:
      "A retailer regenerates product copy for ~4M SKUs each season. Every call carries a large, identical brand voice + policy prompt; caching that shared prefix collapses the input token bill.",
    theDecision:
      "Caching is the build versus buy lever, with a high shared prefix cache share the per call cost drops enough to make the feature economically obvious.",
    whatMostMiss:
      "Teams price this at the naive per call rate and conclude it's too expensive. The brand prompt is most of the tokens, cache it and the economics flip.",
    stakes: "Priced without caching, a 4M SKU refresh looks unaffordable and the feature dies in the business case.",
    takeaway: "Cache the shared prefix, on high volume templated generation it's the difference between viable and not.",
    sources: [
      "Retail catalog copy generation at scale",
      "Prompt-caching / shared-prefix economics",
    ],
    lastVerified: "2026-07-03",
    payload: {
      modelId: LIVE_MODEL_CHEAP,
      prompt:
        "You are a brand copywriter for a national retailer. Using ONLY the brand voice guide and the product attributes below, write a 40-word description and 3 bullet highlights. Match the brand voice exactly; never invent specs.\n\n[brand voice + policy guide ~1,500 tokens]\n[product attributes ~250 tokens]",
      outTok: 200,
      callsPerDay: 130000,
      caching: true,
      cacheShare: 0.85,
      batching: false,
      batchShare: 0.3,
    },
  },
  {
    id: "gap06-telecom-call-summaries",
    labId: "GAP-06",
    industry: "telecom",
    provenance: firstHand,
    title: "Summarize 1.2M care calls a month",
    oneLiner: "The batch discount is the go/no go on the whole program.",
    context:
      "A telecom summarizes ~1.2M care center calls a month for QA and coaching, an offline, non urgent workload. Because it's async, most of it can run through the batch API at a steep discount.",
    theDecision:
      "Batching is the go/no go: at this volume the batch discount is what moves the program from 'too expensive' to fundable, the workload is async, so there's no reason to pay real time rates.",
    whatMostMiss:
      "People price offline workloads at real time rates. Summarization is async; routing it through batch is money left on the table if you don't.",
    stakes: "Priced at real time rates, a 1.2M call summarization program doesn't clear its business case.",
    takeaway: "For async volume, batch it, the discount is the go/no go, not a nice to have.",
    sources: [
      "Telecom care-center call summarization at scale, firsthand (Verizon)",
      "Batch-inference discount economics",
    ],
    lastVerified: "2026-07-03",
    payload: {
      modelId: LIVE_MODEL_CHEAP,
      prompt:
        "You are a care quality analyst. Summarize the support call transcript below into: reason, resolution, sentiment, and one coaching note. Be factual and cite the transcript.\n\n[call transcript ~2,000 tokens]",
      outTok: 150,
      callsPerDay: 40000,
      caching: false,
      cacheShare: 0.6,
      batching: true,
      batchShare: 0.85,
    },
  },
  {
    id: "gap06-adtech-variants",
    labId: "GAP-06",
    industry: "marketing",
    provenance: studied,
    title: "30 creative variants × thousands of campaigns",
    oneLiner: "Unit economics decide whether the variant feature ships at all.",
    context:
      "An adtech platform generates 30 creative variants for each of thousands of campaigns. The per variant cost is tiny, but multiplied across campaign volume it becomes the number that gates the feature.",
    theDecision:
      "Economics before architecture: unit cost × volume decides if the variant feature is viable, model choice, caching, and batching are the levers that gate the roadmap.",
    whatMostMiss:
      "Engineers design the variant pipeline before anyone models the unit economics; at this volume the cost decides the feature, not the other way around.",
    stakes: "Ship the feature without the unit economics model and a tiny per call cost becomes a budget surprise at campaign scale.",
    takeaway: "Model the unit economics before the architecture, at scale, cost decides the feature.",
    sources: [
      "Adtech creative-variant generation at scale",
      "Unit-economics-gated feature decisions",
    ],
    lastVerified: "2026-07-03",
    payload: {
      modelId: LIVE_MODEL_CHEAP,
      prompt:
        "You are a performance creative writer. Using the campaign brief and brand rules below, generate one ad copy variant: a headline (≤8 words) and primary text (≤90 characters). Stay on brand and policy compliant.\n\n[campaign brief + brand rules ~1,200 tokens]",
      outTok: 120,
      callsPerDay: 90000,
      caching: true,
      cacheShare: 0.5,
      batching: true,
      batchShare: 0.6,
    },
  },
]);
