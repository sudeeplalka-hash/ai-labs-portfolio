// EL-08 · Estimation & Scoping Studio — use-cases.
// Payload = a full estimation scenario (same shape EL-08 estimates): a WBS with
// AI-risk phases flagged, an analogous baseline, a three-point (PERT) triple, and
// a scope-change package. The three methods, staffing, and change-control margin
// math all recompute from it.

import { type UseCase, assertUseCases, studied } from "../industries";

export interface El08Task { phase: string; weeks: number; ai?: boolean }
export interface El08Scenario {
  key: string; label: string;
  wbs: El08Task[];
  analogous: { baseWeeks: number; factor: number };
  three: { o: number; m: number; p: number };
  change: { label: string; add: El08Task[] };
}
export interface El08Payload { scenario: El08Scenario }

export const EL08_USE_CASES: UseCase<El08Payload>[] = assertUseCases<El08Payload>([
  {
    id: "el08-insurance-claims-triage",
    labId: "EL-08",
    industry: "insurance",
    provenance: studied,
    title: "Claims triage & extraction estimate",
    oneLiner: "The blow-up isn't the model — it's the messy claims documents nobody scoped.",
    context:
      "An estimate for an insurance claims-triage and document-extraction build. The modeling is routine; the risk lives in data-readiness on heterogeneous claim documents and in the eval harness that proves extraction is accurate enough to act on.",
    theDecision:
      "Price the document long tail as a line item: data-readiness on non-standard claim forms and the eval harness are where insurance AI estimates blow up, so surface them as their own WBS rows and present the PERT range, not the point.",
    whatMostMiss:
      "Estimators anchor on the extraction model and treat document variety as a detail. In claims, the document long tail is the schedule — it's a data-readiness problem wearing a modeling costume.",
    stakes: "Bury data-readiness in 'build' and the estimate is weeks short before the first messy claim form arrives.",
    takeaway: "In insurance claims, the estimate lives or dies on document-readiness — price the long tail as a line item.",
    sources: [
      "Insurance claims-automation estimation (studied)",
      "AI estimation practice — data-readiness & eval as explicit line items",
    ],
    lastVerified: "2026-07-03",
    payload: {
      scenario: {
        key: "claims", label: "Claims triage & extraction (insurance)",
        wbs: [
          { phase: "Discovery & requirements", weeks: 3 },
          { phase: "Data readiness (claim documents)", weeks: 6, ai: true },
          { phase: "Extraction + triage build", weeks: 8 },
          { phase: "Eval-harness build", weeks: 4, ai: true },
          { phase: "Model iteration loops", weeks: 4, ai: true },
          { phase: "Core-system integration", weeks: 6 },
          { phase: "Hardening & UAT", weeks: 4 },
        ],
        analogous: { baseWeeks: 30, factor: 1.2 },
        three: { o: 28, m: 36, p: 56 },
        change: { label: "Add a new claim type + a fraud-signal source", add: [{ phase: "Data readiness (new claim type)", weeks: 4, ai: true }, { phase: "Eval expansion", weeks: 3, ai: true }, { phase: "Build + iteration", weeks: 3 }, { phase: "Regression", weeks: 2 }] },
      },
    },
  },
  {
    id: "el08-pharma-evidence-synthesis",
    labId: "EL-08",
    industry: "pharma",
    provenance: studied,
    title: "Evidence-synthesis assistant estimate",
    oneLiner: "SME-graded eval and GxP documentation are the hidden two-thirds of the estimate.",
    context:
      "An estimate for a pharma R&D evidence-synthesis assistant. The build is manageable; the cost sits in a scientist-graded eval harness (slow, expert-bound) and in the validation and GxP documentation that regulated R&D requires before use.",
    theDecision:
      "Estimate the validation, not just the build: SME-graded evaluation and GxP documentation dominate a regulated R&D estimate, so size them explicitly — the eval loop is expert-rate-limited, not compute-limited.",
    whatMostMiss:
      "Teams estimate the retrieval build and forget that in pharma the eval must be graded by scientists and the whole thing documented for validation. That's the majority of the calendar, not a tail.",
    stakes: "Under-scope SME-graded eval and the estimate assumes a review capacity the science org doesn't have.",
    takeaway: "In pharma R&D, SME-graded eval and GxP validation are most of the estimate — size them, don't assume them.",
    sources: [
      "Pharma R&D informatics estimation (studied)",
      "SME-graded evaluation and GxP validation as estimate drivers",
    ],
    lastVerified: "2026-07-03",
    payload: {
      scenario: {
        key: "evidence", label: "Evidence-synthesis assistant (pharma R&D)",
        wbs: [
          { phase: "Discovery & requirements", weeks: 3 },
          { phase: "Data readiness (corpora + provenance)", weeks: 6, ai: true },
          { phase: "Retrieval + synthesis build", weeks: 7 },
          { phase: "Eval-harness (SME-graded rubric)", weeks: 5, ai: true },
          { phase: "Model iteration loops", weeks: 4, ai: true },
          { phase: "Validation & GxP documentation", weeks: 6 },
          { phase: "Hardening & UAT", weeks: 4 },
        ],
        analogous: { baseWeeks: 26, factor: 1.3 },
        three: { o: 27, m: 35, p: 58 },
        change: { label: "Add a therapeutic area + regulatory-document set", add: [{ phase: "Corpus + provenance (new area)", weeks: 5, ai: true }, { phase: "Eval expansion (SME)", weeks: 4, ai: true }, { phase: "Domain adaptation", weeks: 3 }, { phase: "Validation regression", weeks: 2 }] },
      },
    },
  },
  {
    id: "el08-realestate-valuation-copilot",
    labId: "EL-08",
    industry: "real-estate",
    provenance: studied,
    title: "Valuation & underwriting copilot estimate",
    oneLiner: "The innocent-looking 'add a new market' change re-triggers the whole data-readiness phase.",
    context:
      "An estimate for a property valuation and underwriting copilot. The trap is the scope change: 'add a new market' sounds trivial but re-triggers comps/market data-readiness and eval — the same phase that dominated the original estimate.",
    theDecision:
      "Make the change-order math visible: a new market isn't a config toggle, it re-runs data-readiness and eval, so estimate the change explicitly and let the margin math show why absorbing it silently is the wrong call.",
    whatMostMiss:
      "Stakeholders read 'new market' as small because the model is unchanged. The cost is data — comps, rent-rolls, local rules — so the change re-triggers the most expensive phase, not the cheapest.",
    stakes: "Absorb 'just one more market' silently and margin bleeds out one data-readiness re-run at a time.",
    takeaway: "In real-estate AI, 'add a market' re-runs data-readiness — estimate the change order, don't absorb it.",
    sources: [
      "Real-estate / proptech valuation estimation (studied)",
      "Change-control discipline on data-readiness-driven scope",
    ],
    lastVerified: "2026-07-03",
    payload: {
      scenario: {
        key: "valuation", label: "Valuation & underwriting copilot (real estate)",
        wbs: [
          { phase: "Discovery & requirements", weeks: 2 },
          { phase: "Data readiness (property + comps)", weeks: 5, ai: true },
          { phase: "Valuation model build", weeks: 7 },
          { phase: "Eval-harness build", weeks: 3, ai: true },
          { phase: "Model iteration loops", weeks: 3, ai: true },
          { phase: "Systems integration", weeks: 5 },
          { phase: "Hardening & UAT", weeks: 3 },
        ],
        analogous: { baseWeeks: 22, factor: 1.15 },
        three: { o: 21, m: 27, p: 42 },
        change: { label: "Add a new market + rent-roll ingestion", add: [{ phase: "Data readiness (new market)", weeks: 4, ai: true }, { phase: "Eval expansion", weeks: 2, ai: true }, { phase: "Build + integration", weeks: 3 }, { phase: "Regression", weeks: 1 }] },
      },
    },
  },
]);
