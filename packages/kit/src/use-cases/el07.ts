// EL-07 · RFP/RFI Response War Room, use cases.
// Payload = a complete RFP (same shape EL-07 decomposes): excerpt, compliance
// matrix, evaluation criteria, win themes, and the bid/no-bid inputs (fit,
// win-prob, capacity, margin vs floor). One is engineered as a disciplined no-bid.

import { type UseCase, assertUseCases, studied } from "../industries";

export type El07Status = "met" | "partial" | "gap";
export interface El07Req { text: string; owner: string; evidence: string; status: El07Status }
export interface El07Criterion { name: string; weight: number; score: number }
export interface El07Rfp {
  key: string; label: string; excerpt: string;
  requirements: El07Req[]; criteria: El07Criterion[]; winThemes: string[];
  fit: number; winProb: number; capacity: number; marginPct: number; marginFloor: number;
}
export interface El07Payload { rfp: El07Rfp }

export const EL07_USE_CASES: UseCase<El07Payload>[] = assertUseCases<El07Payload>([
  {
    id: "el07-public-sector-benefits",
    labId: "EL-07",
    industry: "public-sector",
    provenance: studied,
    title: "Benefits-eligibility AI platform bid",
    oneLiner: "A biddable win, but only if you close the ATO and past-performance gates first.",
    context:
      "A government RFP for an AI-assisted benefits-eligibility triage platform. Strong fit, but two public-sector gates, a security authorization (ATO) pathway and direct government past-performance, sit as partials that must be closed before the bid is credible.",
    theDecision:
      "Bid, but gate-first: the pursuit clears the threshold, so the real work is converting the ATO and past-performance partials to met before submission, in gov, an unclosed mandatory gate is a disqualification, not a deduction.",
    whatMostMiss:
      "Bidders treat gov mandatory requirements (ATO, 508, past performance) as scored line items. They're pass/fail gates, a single unmet mandatory zeroes the whole bid regardless of technical score.",
    stakes: "Leave the ATO partial unclosed and a technically winning bid is thrown out on a compliance gate.",
    takeaway: "In public-sector bids, mandatory gates are pass/fail, close the ATO and past-performance partials or don't bid.",
    sources: [
      "Public-sector proposal / capture practice (studied)",
      "Government mandatory-requirement (ATO, Section 508, past-performance) gating",
    ],
    lastVerified: "2026-07-03",
    payload: {
      rfp: {
        key: "gov-benefits",
        label: "Benefits-eligibility AI platform (public sector)",
        excerpt: "Agency seeks an AI-assisted benefits-eligibility triage platform. Mandatory: accessibility (Section 508 / WCAG 2.2 AA), in-country data residency with an authorization-to-operate (ATO) pathway, bias & equity-of-access testing, and direct government past performance. 30-week fixed price with milestone acceptance; price weighted.",
        requirements: [
          { text: "Accessibility (Section 508 / WCAG 2.2 AA)", owner: "Delivery lead", evidence: "Accessible-UI patterns + audit", status: "met" },
          { text: "Data residency + ATO pathway", owner: "Security", evidence: "ATO plan (in progress)", status: "partial" },
          { text: "Named EM with public-sector delivery", owner: "Staffing", evidence: "EM profile + gov references", status: "met" },
          { text: "Bias & equity-of-access testing", owner: "Governance", evidence: "Equity-testing framework", status: "met" },
          { text: "Direct government past performance (2+ refs)", owner: "Capture", evidence: "One direct, one adjacent", status: "partial" },
        ],
        criteria: [
          { name: "Technical approach", weight: 0.30, score: 80 },
          { name: "Past performance", weight: 0.25, score: 72 },
          { name: "Team & delivery model", weight: 0.20, score: 80 },
          { name: "Price", weight: 0.15, score: 68 },
          { name: "Security & compliance", weight: 0.10, score: 85 },
        ],
        winThemes: ["Accessibility-first delivery", "Equity-of-access testing", "ATO-ready governance"],
        fit: 0.80, winProb: 0.60, capacity: 0.80, marginPct: 28, marginFloor: 25,
      },
    },
  },
  {
    id: "el07-cybersecurity-soc-nobid",
    labId: "EL-07",
    industry: "cybersecurity",
    provenance: studied,
    title: "Autonomous SOC triage, the disciplined no-bid",
    oneLiner: "Attractive scope, un-survivable terms, the senior move is to decline and say why.",
    context:
      "An MSSP RFP for an autonomous SOC triage agent. The scope is appealing, but the commercial terms are the story: a guarantee of zero missed critical alerts and uncapped breach liability are red lines no responsible bidder accepts.",
    theDecision:
      "No-bid, on terms, not capability: a 'zero missed criticals' guarantee is technically impossible and uncapped indemnity is a bet-the-firm liability, so decline regardless of how good the fit looks.",
    whatMostMiss:
      "Teams engage on the exciting technical scope and only hit the commercial red lines after burning capture time. Read the terms first, some RFPs are un-winnable by construction, not by competition.",
    stakes: "Accept 'zero missed criticals' and uncapped liability and one inevitable miss is an existential claim.",
    takeaway: "Some RFPs are no-bids on terms alone, an impossible guarantee and uncapped liability end it before fit matters.",
    sources: [
      "Cybersecurity services capture / risk review (studied)",
      "Commercial red-line discipline (guarantees, liability caps, indemnity)",
    ],
    lastVerified: "2026-07-03",
    payload: {
      rfp: {
        key: "cyber-soc",
        label: "Autonomous SOC triage (cybersecurity)",
        excerpt: "MSSP seeks a partner to deliver an autonomous SOC triage agent. Must guarantee zero missed critical alerts and accept uncapped liability for any breach. 10-week fixed price with penalties; client threat data withheld until week 3; incumbent SIEM integration favored; lowest price wins.",
        requirements: [
          { text: "Guarantee zero missed critical alerts", owner: "Delivery", evidence: ", undeliverable guarantee", status: "gap" },
          { text: "Accept uncapped breach liability", owner: "Commercial", evidence: ", commercial red line", status: "gap" },
          { text: "10-week fixed price with penalties", owner: "Commercial", evidence: "N/A", status: "gap" },
          { text: "Deliver with threat data withheld to week 3", owner: "Data", evidence: "critical-path risk", status: "gap" },
          { text: "Displace incumbent SIEM integration", owner: "Sales", evidence: "adjacent only", status: "partial" },
        ],
        criteria: [
          { name: "Technical approach", weight: 0.30, score: 62 },
          { name: "Relevant experience", weight: 0.25, score: 58 },
          { name: "Team & delivery model", weight: 0.20, score: 68 },
          { name: "Price", weight: 0.15, score: 40 },
          { name: "Assurance & terms", weight: 0.10, score: 55 },
        ],
        winThemes: ["Thin, commercial terms are the blocker"],
        fit: 0.45, winProb: 0.20, capacity: 0.50, marginPct: 12, marginFloor: 25,
      },
    },
  },
  {
    id: "el07-retail-peak-personalization",
    labId: "EL-07",
    industry: "retail",
    provenance: studied,
    title: "Peak-season personalization bid",
    oneLiner: "Strong fit and a hard date, win on measurable lift, not lowest price.",
    context:
      "A national retailer's RFP for AI personalization and search relevance ahead of peak season. Value and speed are weighted over lowest price, which plays to a differentiated, measurement-led response with a hard Black-Friday deadline.",
    theDecision:
      "Bid to win on lift, not price: fit and win themes are strong and the buyer weights value over cost, so lead with measurable lift and peak-load resilience, and be honest that the 16-week date is the real risk.",
    whatMostMiss:
      "Teams race to the lowest price on retail bids the buyer explicitly scores on value. When speed and lift are weighted, discounting signals weakness, differentiate on measurable outcome instead.",
    stakes: "The 16-week hard date before peak is the binding constraint, miss it and the whole engagement misses its window.",
    takeaway: "In retail peak bids weighted on value, win on measurable lift and the hard date, not on price.",
    sources: [
      "Retail / e-commerce proposal practice (studied)",
      "Value-weighted evaluation and peak-season delivery constraints",
    ],
    lastVerified: "2026-07-03",
    payload: {
      rfp: {
        key: "retail-peak",
        label: "Peak-season personalization (retail)",
        excerpt: "National retailer seeks AI personalization and search relevance for peak season. 16-week delivery before Black Friday; proven e-commerce scale, A/B measurement with lift attribution, and brand-safe generation required. Value and speed weighted over lowest price.",
        requirements: [
          { text: "Proven personalization at e-commerce scale", owner: "Delivery lead", evidence: "Retail personalization case study", status: "met" },
          { text: "16-week delivery before peak", owner: "Delivery", evidence: "PERT plan (aggressive but feasible)", status: "partial" },
          { text: "A/B measurement & lift attribution", owner: "Analytics", evidence: "Experimentation framework", status: "met" },
          { text: "Brand-safe content generation", owner: "Governance", evidence: "Brand-safety guardrails", status: "met" },
          { text: "Peak-load resilience / SRE", owner: "Platform", evidence: "Load plan (draft)", status: "partial" },
        ],
        criteria: [
          { name: "Technical approach", weight: 0.30, score: 84 },
          { name: "Relevant experience", weight: 0.25, score: 82 },
          { name: "Team & delivery model", weight: 0.20, score: 80 },
          { name: "Price", weight: 0.15, score: 72 },
          { name: "Measurement", weight: 0.10, score: 85 },
        ],
        winThemes: ["Proven peak-scale personalization", "Lift you can measure", "Brand-safe by design"],
        fit: 0.85, winProb: 0.60, capacity: 0.75, marginPct: 32, marginFloor: 25,
      },
    },
  },
]);
