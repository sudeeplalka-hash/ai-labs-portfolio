// C3-5 · Business Case / ROI Builder — use-cases.
// Payload = an input preset (the five ROI drivers). The same NPV/IRR/payback +
// tornado engine runs it. Each preset is shaped so a different driver dominates the
// tornado: education → adoption ramp; manufacturing → annual value (scrap rate);
// travel → annual value band (disruption frequency).

import { type UseCase, assertUseCases, studied } from "../industries";

export interface C35Payload {
  investment: number;
  annualValue: number;
  rampMonths: number;
  runCost: number;
  rate: number;
}

export const C35_USE_CASES: UseCase<C35Payload>[] = assertUseCases<C35Payload>([
  {
    id: "c35-education-tutoring",
    labId: "C3-5",
    industry: "education",
    provenance: studied,
    title: "AI-tutoring rollout across a district",
    oneLiner: "The whole case rides on how fast students and teachers adopt it.",
    context:
      "A school district builds the business case for an AI tutoring rollout. The value is real but back-loaded — it only lands once teachers embed it and students use it, and that ramp in a district is slow and uncertain.",
    theDecision:
      "Present the range, not the point — the tornado shows adoption ramp swings the NPV more than any cost line, so fund conditional on the ramp, not the plan number.",
    whatMostMiss:
      "Education cases over-index on the annual-value estimate; the real uncertainty is the adoption ramp, and a slow ramp quietly halves the three-year value.",
    stakes: "Funding on a single optimistic NPV and missing the ramp turns a 'positive' case negative by year two.",
    takeaway: "When adoption is the swing driver, fund on the band and govern the ramp.",
    sources: [
      "Ed-tech ROI (adoption-ramp-dominated value)",
      "District technology change-management timelines",
    ],
    lastVerified: "2026-07-03",
    payload: { investment: 500_000, annualValue: 1_200_000, rampMonths: 15, runCost: 150_000, rate: 7 },
  },
  {
    id: "c35-manufacturing-defect",
    labId: "C3-5",
    industry: "manufacturing",
    provenance: studied,
    title: "Defect-detection rollout on the line",
    oneLiner: "The scrap-rate assumption is the whole business case.",
    context:
      "A manufacturer builds the case for AI defect detection on a production line. The value is scrap-rate reduction — but the assumed baseline scrap rate and the improvement are estimates, and the case lives or dies on them.",
    theDecision:
      "The tornado shows the annual-value (scrap-rate) assumption dominates; fund on the band and instrument the baseline before scaling.",
    whatMostMiss:
      "Teams present a crisp NPV built on an un-measured baseline scrap rate. The honest move is to widen the band on that one assumption and measure it in the pilot.",
    stakes: "A defect-detection case built on an optimistic scrap baseline can miss its number by half once the real rate is measured.",
    takeaway: "When one assumption swings the case, measure it in the pilot before you scale.",
    sources: [
      "Manufacturing defect-detection ROI (scrap-rate sensitivity)",
      "Quality / OEE business-case practice",
    ],
    lastVerified: "2026-07-03",
    payload: { investment: 800_000, annualValue: 2_000_000, rampMonths: 5, runCost: 200_000, rate: 12 },
  },
  {
    id: "c35-travel-irops",
    labId: "C3-5",
    industry: "travel",
    provenance: studied,
    title: "Airline irregular-ops automation",
    oneLiner: "Value depends on how bad the disruption year is — fund on the band.",
    context:
      "An airline builds the case for automating irregular-ops rebooking. The value is realized during disruptions (storms, IROPs) — so the annual value swings with how bad the disruption year is, which no one can forecast.",
    theDecision:
      "Present the range — the annual-value band (disruption frequency) is wide, so fund on the downside-positive band rather than a point estimate tied to an average year.",
    whatMostMiss:
      "The case is built on an 'average' disruption year that never happens; the value is lumpy, and the honest case funds on the band that stays positive even in a mild year.",
    stakes: "Justify the spend on a heavy-disruption year and a mild one leaves the case underwater.",
    takeaway: "For lumpy, event-driven value, fund on the band that survives a mild year.",
    sources: [
      "Airline IROPs automation value (disruption-frequency variance)",
      "Event-driven ROI banding",
    ],
    lastVerified: "2026-07-03",
    payload: { investment: 600_000, annualValue: 1_600_000, rampMonths: 8, runCost: 180_000, rate: 10 },
  },
]);
