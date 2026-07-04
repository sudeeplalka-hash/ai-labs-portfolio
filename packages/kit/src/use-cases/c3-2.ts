// C3-2 · Build-vs-Buy-vs-Fine-Tune — use-cases.
// Payload = an input preset (volume + the four 0–2 sliders). The same TCO+score
// engine computes the verdict. Presets are chosen so the three use-cases land on
// three different winners (API / Buy / Fine-tune) — one evaluator, all three paths.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface C32Payload {
  volume: number;
  dataSens: number; // 0 Low · 1 Med · 2 High
  diffNeed: number; // 0 Low · 1 Med · 2 High
  latency: number; // 0 Relaxed · 1 Moderate · 2 Strict
  teamSkill: number; // 0 Low · 1 Med · 2 High
}

export const C32_USE_CASES: UseCase<C32Payload>[] = assertUseCases<C32Payload>([
  {
    id: "c32-legal-contract-analysis",
    labId: "C3-2",
    industry: "legal",
    provenance: studied,
    title: "Contract analysis: buy, build, or fine-tune?",
    oneLiner: "The firm's precedents are the moat — does that flip it to fine-tune?",
    context:
      "A law firm evaluates AI for contract analysis. A COTS legal-AI suite is fast; an API build is cheap; fine-tuning on the firm's own precedent library is where the differentiation lives — but it needs a team the firm doesn't have yet.",
    theDecision:
      "At this volume and team skill, the cheaper paths win on speed; fine-tune only pulls ahead once the precedent-trained edge is worth staffing a build.",
    whatMostMiss:
      "Firms fixate on the vendor demo and ignore the flip condition: the moment 'trained on our precedents' becomes a client-facing edge, the math tips to fine-tune.",
    stakes: "Pick for speed and you may lock in just before the capability becomes your differentiator — an expensive 18-month mistake.",
    takeaway: "Differentiation on your own data is the flip condition — watch it, don't just pick the demo.",
    sources: [
      "Legal-AI build/buy patterns (COTS suites vs API vs precedent fine-tuning)",
      "Professional-services differentiation economics",
    ],
    lastVerified: "2026-07-03",
    payload: { volume: 800_000, dataSens: 2, diffNeed: 2, latency: 1, teamSkill: 1 },
  },
  {
    id: "c32-media-localization",
    labId: "C3-2",
    industry: "media",
    provenance: studied,
    title: "High-volume localization at scale",
    oneLiner: "At scale, a flat license beats the self-host you assumed.",
    context:
      "A media company localizes and dubs a growing catalog at tens of millions of inferences a month. The reflex at this scale is to self-host a fine-tuned model — but localization is largely a commodity capability.",
    theDecision:
      "At commodity volume with low differentiation, the flat COTS license actually wins — cheaper than usage-based API and than the self-host most teams assume. Self-host is only the flip once quality becomes a differentiator.",
    whatMostMiss:
      "The reflex at scale is 'build.' For a commodity capability a fixed-price license often beats it; self-host wins only once control or quality becomes your edge.",
    stakes: "Building what you could license burns a team and a year on undifferentiated plumbing.",
    takeaway: "At commodity scale, a flat license can beat self-host — don't build what you can license.",
    sources: [
      "Media localization/dubbing at scale (license vs self-host economics)",
      "Commodity-vs-differentiated capability sourcing",
    ],
    lastVerified: "2026-07-03",
    payload: { volume: 12_000_000, dataSens: 0, diffNeed: 0, latency: 1, teamSkill: 2 },
  },
  {
    id: "c32-bank-fraud-model",
    labId: "C3-2",
    industry: "financial-services",
    provenance: firstHand,
    title: "Fraud model: build or buy?",
    oneLiner: "Data gravity and real-time latency pin it to self-host.",
    context:
      "A card issuer decides how to run its fraud model. A vendor is fast to stand up, but the training data can't leave the bank, scoring must happen in real time, and the model itself is a competitive edge.",
    theDecision:
      "Self-host / fine-tune wins here — data gravity, sub-100ms latency, and differentiation all point the same way, and the bank has the team to run it.",
    whatMostMiss:
      "The vendor's time-to-value is seductive, but on fraud the data can't move and the latency is non-negotiable — control isn't a preference, it's a constraint.",
    stakes: "A vendor round-trip that adds latency or moves fraud data off-prem isn't a cost line — it's a regulatory and loss-rate problem.",
    takeaway: "When data can't move and latency is a constraint, control stops being optional.",
    sources: [
      "Fraud-model build/buy — first-hand (cards & payments, American Express)",
      "Real-time scoring + data-gravity constraints",
    ],
    lastVerified: "2026-07-03",
    payload: { volume: 6_000_000, dataSens: 2, diffNeed: 2, latency: 2, teamSkill: 2 },
  },
]);
