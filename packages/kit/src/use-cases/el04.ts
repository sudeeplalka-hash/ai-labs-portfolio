// EL-04 · Delivery Health & RAID Radar, use cases.
// Payload = a full delivery portfolio (matches the Scenario shape EL-04 reads).
// Each portfolio hides one "reads green but is sinking" trap that embodies the
// industry lesson: insurance = model drift; energy = a hidden OT-data dependency;
// e-commerce = adoption quietly reversing.

import { type UseCase, assertUseCases, studied } from "../industries";

export type El04Health = "green" | "amber" | "red";
export type El04Trend = "up" | "flat" | "down";
export interface El04RaidItem { text: string; sev?: "high" | "med" | "low" }
export interface El04Workstream {
  id: string;
  name: string;
  owner: string;
  reported: El04Health;
  actual: El04Health;
  trend: El04Trend;
  delta: number;
  summary: string;
  brief: { whatChanged: string; topConcern: string; ask: string };
  raid: { risks: El04RaidItem[]; assumptions: string[]; issues: El04RaidItem[]; dependencies: El04RaidItem[] };
}
export interface El04Payload {
  key: string;
  label: string;
  note: string;
  adoptionIndex: number;
  burnVariance: number;
  workstreams: El04Workstream[];
}

export const EL04_USE_CASES: UseCase<El04Payload>[] = assertUseCases<El04Payload>([
  {
    id: "el04-insurance-claims",
    labId: "EL-04",
    industry: "insurance",
    provenance: studied,
    title: "Claims-automation program, the drift hides",
    oneLiner: "Extraction reads green on rollout while model drift pulls it amber.",
    context:
      "A claims-automation program. Doc-extraction is reported green on its rollout milestones, but model drift on new document types has quietly pulled its real accuracy into amber, and the milestone view can't see it.",
    theDecision:
      "Report trajectory, not the snapshot: the extraction workstream is green on paper and sinking on drift; the steering call is to fund a drift-hardening spike before it hits production.",
    whatMostMiss:
      "Delivery milestones track 'shipped,' not 'still accurate.' Model drift is invisible to a milestone view and shows up first as a downward trend on quality, not a red flag.",
    stakes: "A drifting extraction model that reaches production is denied claims and reopened files, a leakage and CX event.",
    takeaway: "On AI programs, drift is a trajectory problem, a green milestone with a falling accuracy line is really amber.",
    sources: [
      "Insurance claims-automation delivery patterns",
      "Model-drift monitoring as a RAG/trajectory signal",
    ],
    lastVerified: "2026-07-03",
    payload: {
      key: "insurance",
      label: "Claims-automation program",
      note: "FNOL triage, doc extraction, adjuster assist, fraud, insurance, illustrative.",
      adoptionIndex: 55,
      burnVariance: 8,
      workstreams: [
        {
          id: "fnol", name: "FNOL triage assist", owner: "Intake pod",
          reported: "green", actual: "green", trend: "flat", delta: 0,
          summary: "Triaging ~30% of intake straight-through; steady.",
          brief: { whatChanged: "Steady week; straight-through rate held at 30%.", topConcern: "CAT-season volume ramp in 4 weeks.", ask: "Approve surge staffing before CAT season, decision by Friday." },
          raid: { risks: [{ text: "CAT-season surge outpaces triage capacity", sev: "med" }], assumptions: ["Loss mix stays within seasonal norms"], issues: [], dependencies: [{ text: "Policy-admin API stability (Platform)", sev: "low" }] },
        },
        {
          id: "extraction", name: "Claims document extraction", owner: "Extraction pod",
          reported: "green", actual: "amber", trend: "down", delta: -12,
          summary: "Reported green on rollout, but extraction accuracy slid 12 pts on new document types.",
          brief: {
            whatChanged: "Accuracy fell from 90% to 78% as new carrier document formats entered the pipeline; drift monitor is manual.",
            topConcern: "Tracked green on rollout milestones, but real accuracy is drifting down, the milestone view is hiding it.",
            ask: "Fund a 1-sprint drift-hardening spike and gate new document types on eval, decision needed this steering.",
          },
          raid: {
            risks: [{ text: "Drifted extraction reaches production and mis-populates claims", sev: "high" }],
            assumptions: ["New document formats reuse the existing eval set, proving false"],
            issues: [{ text: "Extraction accuracy 78% vs 90% gate", sev: "high" }, { text: "Drift monitoring is a manual weekly check", sev: "med" }],
            dependencies: [{ text: "Labeled samples for new formats (Ops)", sev: "high" }],
          },
        },
        {
          id: "adjuster", name: "Adjuster copilot", owner: "Claims pod",
          reported: "amber", actual: "amber", trend: "up", delta: 7,
          summary: "Recovering: adjuster adoption up 7 pts after workflow fixes.",
          brief: { whatChanged: "Embedded the copilot in the claims desktop; adoption up 7 pts.", topConcern: "Citation quality still uneven on complex claims.", ask: "Green-light citation-quality work next sprint, FYI." },
          raid: { risks: [{ text: "Adoption stalls if citation trust doesn't improve", sev: "med" }], assumptions: ["Adjuster workflow stays stable"], issues: [{ text: "Uneven citation quality on complex claims", sev: "med" }], dependencies: [{ text: "Policy-language corpus refresh (Legal)", sev: "med" }] },
        },
        {
          id: "fraud", name: "Claims-fraud scoring", owner: "SIU pod",
          reported: "red", actual: "red", trend: "flat", delta: 0,
          summary: "Known red: false-positive rate too high; SIU capacity swamped.",
          brief: { whatChanged: "No movement; false-positive rate stuck at 3× the SIU capacity to review.", topConcern: "Threshold tuning under-scoped; SIU can't work the queue.", ask: "Decide: raise the score threshold now (accept some misses) or add SIU capacity, steering call today." },
          raid: { risks: [{ text: "SIU backlog grows until the model is trusted", sev: "high" }], assumptions: ["Baseline fraud rate matched the training data, proved optimistic"], issues: [{ text: "False positives at 3× SIU review capacity", sev: "high" }], dependencies: [{ text: "SIU staffing decision (Ops)", sev: "high" }] },
        },
      ],
    },
  },
  {
    id: "el04-energy-grid",
    labId: "EL-04",
    industry: "energy",
    provenance: studied,
    title: "Grid-forecasting program, the hidden dependency",
    oneLiner: "Outage prediction reads green on metrics while an OT-data feed is failing under it.",
    context:
      "A grid-forecasting program. Outage prediction reports green on its model metrics, but a SCADA/sensor (OT) data dependency is degrading, the model looks fine while its inputs quietly fail, making its real health red.",
    theDecision:
      "The steering call is on the dependency nobody watches: the outage workstream is green on model accuracy but red on an OT-data feed, and the fix is upstream, not in the model.",
    whatMostMiss:
      "Everyone watches the model's accuracy; nobody watches the OT-data pipeline feeding it. The hidden red is a dependency, and it surfaces as a model problem when it isn't one.",
    stakes: "An outage model running on stale OT data mis-predicts exactly when the grid is stressed, a reliability and safety exposure.",
    takeaway: "The hidden red is usually a dependency, watch the OT-data feed, not just the model metric.",
    sources: [
      "Utility grid-forecasting delivery patterns",
      "OT/IT data-dependency risk in AI programs",
    ],
    lastVerified: "2026-07-03",
    payload: {
      key: "energy",
      label: "Grid-forecasting program",
      note: "Load forecasting, outage prediction, field service, DER, energy/utilities, illustrative.",
      adoptionIndex: 60,
      burnVariance: 5,
      workstreams: [
        {
          id: "load", name: "Load forecasting model", owner: "Forecasting pod",
          reported: "green", actual: "green", trend: "up", delta: 4,
          summary: "Forecast error down 4 pts after a feature refresh; performing well.",
          brief: { whatChanged: "MAPE improved 4 pts after adding weather-normalized features.", topConcern: "Extreme-weather regime shifts test the model's tails.", ask: "Approve a tail-stress eval next sprint, FYI." },
          raid: { risks: [{ text: "Extreme-weather regimes fall outside training", sev: "med" }], assumptions: ["Historical weather is representative of the season"], issues: [], dependencies: [{ text: "Weather-feed vendor SLA", sev: "low" }] },
        },
        {
          id: "outage", name: "Outage prediction", owner: "Reliability pod",
          reported: "green", actual: "red", trend: "down", delta: -18,
          summary: "Reads green on model metrics, but a degrading SCADA/sensor feed is failing silently under it.",
          brief: {
            whatChanged: "Model accuracy still 'green' on the dashboard, but 22% of feeder-sensor telemetry is stale or dropped, the model is scoring on old data.",
            topConcern: "The health is tracked on model metrics, but the real red is an OT-data dependency nobody is monitoring, it looks like a model that's fine.",
            ask: "Escalate the OT-telemetry fix to Grid Operations and gate predictions on data freshness, decision needed today.",
          },
          raid: {
            risks: [{ text: "Stale-data predictions miss an outage during a stress event", sev: "high" }],
            assumptions: ["Sensor telemetry is complete and fresh, proving false"],
            issues: [{ text: "22% of feeder-sensor telemetry stale or dropped", sev: "high" }, { text: "No freshness gate on model inputs", sev: "high" }],
            dependencies: [{ text: "SCADA/OT telemetry pipeline (Grid Ops, OT team)", sev: "high" }],
          },
        },
        {
          id: "fieldsvc", name: "Field-service copilot", owner: "Field ops pod",
          reported: "amber", actual: "amber", trend: "flat", delta: 0,
          summary: "Holding amber: connectivity gaps limit field adoption.",
          brief: { whatChanged: "No change; rural connectivity still caps usage.", topConcern: "Offline mode not yet shipped.", ask: "Prioritize offline-first in the next release, budget note." },
          raid: { risks: [{ text: "Field adoption stalls without offline mode", sev: "med" }], assumptions: ["Coverage improves on schedule, uncertain"], issues: [{ text: "No offline mode for dead zones", sev: "med" }], dependencies: [{ text: "Field-device MDM rollout (IT)", sev: "med" }] },
        },
        {
          id: "der", name: "DER optimization", owner: "DER pod",
          reported: "amber", actual: "green", trend: "up", delta: 9,
          summary: "Under-reported: DER dispatch savings ahead of plan.",
          brief: { whatChanged: "Dispatch savings running ahead of plan; reported cautiously amber.", topConcern: "Regulatory approval for expanded DER control pending.", ask: "Nothing this steering, flagging the upside." },
          raid: { risks: [{ text: "Regulatory delay caps the expansion", sev: "low" }], assumptions: ["DER participation holds"], issues: [], dependencies: [{ text: "Regulator sign off (External)", sev: "med" }] },
        },
      ],
    },
  },
  {
    id: "el04-ecommerce-personalization",
    labId: "EL-04",
    industry: "retail",
    provenance: studied,
    title: "Personalization program, adoption reverses",
    oneLiner: "Search ships green while merchandisers quietly revert to manual.",
    context:
      "An e-commerce personalization program. Semantic search is reported green on delivery, but merchandiser adoption is quietly reversing, they're overriding the AI results back to manual, so the real health is amber.",
    theDecision:
      "Reported vs actual: search is green on delivery but its adoption is sliding, and the steering call is to fix the merchandiser trust gap before the reversal becomes permanent.",
    whatMostMiss:
      "Delivery reports 'launched.' It doesn't report that the users are silently turning it off. Adoption reversal is the earliest signal that a launched feature is failing.",
    stakes: "A personalization feature the merchandisers won't use is sunk cost plus a conversion drag versus the manual baseline.",
    takeaway: "Watch adoption, not just launch, a green delivery status with users reverting to manual is amber.",
    sources: [
      "E-commerce personalization delivery patterns",
      "Adoption-reversal as an early failure signal",
    ],
    lastVerified: "2026-07-03",
    payload: {
      key: "ecommerce",
      label: "Personalization program",
      note: "Recommendations, semantic search, merchandising, service, retail/e-commerce, illustrative.",
      adoptionIndex: 48,
      burnVariance: 9,
      workstreams: [
        {
          id: "recs", name: "Product recommendations", owner: "Recs pod",
          reported: "green", actual: "green", trend: "flat", delta: 0,
          summary: "Recs lifting attach-rate; steady.",
          brief: { whatChanged: "Attach-rate held; no regressions.", topConcern: "Cold-start on new SKUs still weak.", ask: "Approve cold-start work next sprint, FYI." },
          raid: { risks: [{ text: "Cold-start gaps on new SKUs", sev: "low" }], assumptions: ["Catalog velocity stays stable"], issues: [], dependencies: [{ text: "Catalog feed freshness (Data)", sev: "low" }] },
        },
        {
          id: "search", name: "Semantic search", owner: "Search pod",
          reported: "green", actual: "amber", trend: "down", delta: -10,
          summary: "Reported green on launch, but merchandiser adoption is reversing, overrides back to manual up sharply.",
          brief: {
            whatChanged: "Launched to all categories, but merchandiser override-to-manual rate rose from 12% to 34%, they don't trust the AI ranking on promoted lines.",
            topConcern: "Delivery status is green (launched), but adoption is quietly reversing, the launch metric is hiding it.",
            ask: "Fund a merchandiser-trust sprint (explainable ranking + manual pins) and pause the promo-ranking rollout, decision this steering.",
          },
          raid: {
            risks: [{ text: "Reversal becomes permanent and the feature is abandoned", sev: "high" }],
            assumptions: ["Merchandisers would trust AI ranking on promoted lines, proving false"],
            issues: [{ text: "Override-to-manual up from 12% to 34%", sev: "high" }, { text: "No manual-pin control for merchandisers", sev: "med" }],
            dependencies: [{ text: "Ranking-explainability work (ML platform)", sev: "med" }],
          },
        },
        {
          id: "merch", name: "Merchandising copilot", owner: "Merch pod",
          reported: "amber", actual: "amber", trend: "up", delta: 6,
          summary: "Recovering: copilot suggestions accepted more after tuning.",
          brief: { whatChanged: "Suggestion-accept rate up 6 pts after category tuning.", topConcern: "Seasonal catalog churn tests generalization.", ask: "None, trending the right way." },
          raid: { risks: [{ text: "Seasonal churn degrades suggestions", sev: "med" }], assumptions: ["Category taxonomy stays stable"], issues: [{ text: "Generalization weak on seasonal lines", sev: "med" }], dependencies: [{ text: "Merch calendar integration (Ops)", sev: "low" }] },
        },
        {
          id: "service", name: "Post-purchase service bot", owner: "Service pod",
          reported: "red", actual: "red", trend: "flat", delta: 0,
          summary: "Known red: containment below bar; escalations high.",
          brief: { whatChanged: "No movement; containment stuck at 44% vs 65% target.", topConcern: "Order-system integration gaps force handoffs.", ask: "Decide: narrow the bot to returns/tracking only, or fund the order-system integration, steering call today." },
          raid: { risks: [{ text: "Low containment erodes the ROI case", sev: "high" }], assumptions: ["Order-system APIs covered the needed intents, proved false"], issues: [{ text: "Containment 44% vs 65% target", sev: "high" }], dependencies: [{ text: "Order-management API work (Platform)", sev: "high" }] },
        },
      ],
    },
  },
]);
