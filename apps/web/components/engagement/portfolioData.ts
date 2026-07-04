// Shared engagement sample data — the single source both EL-04 (RAID Radar) and
// EL-10 (Exec Communication Studio) read from, so the exec-comms studio genuinely
// "consumes" the delivery data rather than duplicating it. Authored, anonymized,
// industry-labeled (no client names); numbers invented but plausible.

import type { BadgeTone } from "@labs/design-system";

export type Health = "green" | "amber" | "red";
export type Trend = "up" | "flat" | "down";

export interface RaidItem { text: string; sev?: "high" | "med" | "low" }
export interface Workstream {
  id: string;
  name: string;
  owner: string;
  reported: Health;
  actual: Health;
  trend: Trend;
  delta: number;
  summary: string;
  brief: { whatChanged: string; topConcern: string; ask: string };
  raid: { risks: RaidItem[]; assumptions: string[]; issues: RaidItem[]; dependencies: RaidItem[] };
}
export interface Scenario {
  key: string;
  label: string;
  note: string;
  adoptionIndex: number;   // % of target users actively using (echoes EL-01)
  burnVariance: number;    // spend vs plan, % (echoes C3 #1 Financials)
  workstreams: Workstream[];
}

export const SCENARIOS: Scenario[] = [
  {
    key: "cards",
    label: "Card & payments portfolio",
    note: "Card-member servicing, disputes, fraud, KYC — finserv, anonymized, illustrative.",
    adoptionIndex: 63,
    burnVariance: 6,
    workstreams: [
      {
        id: "servicing", name: "Card-member servicing assist", owner: "Servicing pod",
        reported: "green", actual: "green", trend: "flat", delta: 0,
        summary: "Assist deflecting ~22% of Tier-1 contacts; CSAT steady.",
        brief: {
          whatChanged: "Steady week. Containment held at 22%; no eval regressions.",
          topConcern: "Peak-season volume ramp begins in 3 weeks; capacity buffer is thin.",
          ask: "Approve a 2-agent floor-champion backfill before the ramp — decision needed by Friday.",
        },
        raid: {
          risks: [{ text: "Peak-season volume may outpace the assist's containment gains", sev: "med" }],
          assumptions: ["Contact mix stays within ±10% of the last quarter"],
          issues: [],
          dependencies: [{ text: "Telephony routing change (Platform team)", sev: "low" }],
        },
      },
      {
        id: "disputes", name: "Disputes automation", owner: "Disputes pod",
        reported: "green", actual: "amber", trend: "down", delta: -14,
        summary: "Reported green, but eval pass-rate slipped 14 pts and agent adoption stalled at 41%.",
        brief: {
          whatChanged: "Golden-set pass-rate fell from 91% to 77% after the new dispute categories landed; adoption flat at 41%.",
          topConcern: "The status is reported green on delivery milestones, but quality and adoption are both trending down — the milestone view is hiding it.",
          ask: "Fund a 1-sprint eval-hardening spike and pause the category expansion — decision needed at this steering.",
        },
        raid: {
          risks: [{ text: "Quality slide reaches production before it's caught in review", sev: "high" }],
          assumptions: ["New dispute categories reuse the existing eval harness — proving false"],
          issues: [{ text: "Golden-set pass-rate 77% vs 90% gate", sev: "high" }, { text: "Adoption stalled at 41% of agents", sev: "med" }],
          dependencies: [{ text: "Labeled data for new categories (Ops)", sev: "high" }],
        },
      },
      {
        id: "fraud", name: "Fraud alert triage", owner: "Fraud pod",
        reported: "amber", actual: "amber", trend: "up", delta: 8,
        summary: "Recovering: false-positive rate down 8 pts after threshold tuning.",
        brief: {
          whatChanged: "Threshold retune cut false positives 8 pts; analyst queue back under SLA.",
          topConcern: "Model drift monitor still manual; recovery is fragile without automation.",
          ask: "Green-light the drift-monitor automation in next sprint — no steering decision required, FYI.",
        },
        raid: {
          risks: [{ text: "Drift recurs without automated monitoring", sev: "med" }],
          assumptions: ["Analyst headcount holds through Q3"],
          issues: [{ text: "Drift monitoring is still a manual weekly check", sev: "med" }],
          dependencies: [{ text: "Feature store refresh cadence (Data platform)", sev: "med" }],
        },
      },
      {
        id: "kyc", name: "KYC document intelligence", owner: "KYC pod",
        reported: "red", actual: "red", trend: "flat", delta: 0,
        summary: "Known red: extraction accuracy below bar on non-standard documents; escalated.",
        brief: {
          whatChanged: "No movement. Accuracy on non-standard docs stuck at 68% vs 90% target.",
          topConcern: "Data-readiness discovery was under-scoped; the model can't clear the bar on the long tail of document formats.",
          ask: "Decide: narrow scope to the top-5 document types for launch, or extend timeline 6 weeks — steering call today.",
        },
        raid: {
          risks: [{ text: "Timeline slips again if scope isn't cut", sev: "high" }],
          assumptions: ["Document formats were representative in the pilot — proved false"],
          issues: [{ text: "68% extraction accuracy on non-standard docs", sev: "high" }],
          dependencies: [{ text: "Compliance sign-off on reduced scope (Risk)", sev: "high" }],
        },
      },
    ],
  },
  {
    key: "telecom",
    label: "Telecom care portfolio",
    note: "Care routing, network ops, churn, field dispatch — telecom, anonymized, illustrative.",
    adoptionIndex: 58,
    burnVariance: 11,
    workstreams: [
      {
        id: "routing", name: "Care contact routing assist", owner: "Care pod",
        reported: "green", actual: "green", trend: "up", delta: 5,
        summary: "Intent routing lifting first-contact resolution; misroutes at a new low.",
        brief: {
          whatChanged: "First-contact resolution up 5 pts after an intent-model retrain; misroute rate at a new low.",
          topConcern: "Holiday volume surge in 4 weeks; the overflow plan isn't finalized.",
          ask: "Approve the overflow staffing plan before the surge — decision needed by Friday.",
        },
        raid: {
          risks: [{ text: "Volume surge outpaces the routing gains", sev: "med" }],
          assumptions: ["Contact mix stays stable through the surge"],
          issues: [],
          dependencies: [{ text: "IVR menu change (Telephony)", sev: "low" }],
        },
      },
      {
        id: "netops", name: "Network-ops triage copilot", owner: "NOC pod",
        reported: "green", actual: "amber", trend: "down", delta: -13,
        summary: "Reported green on rollout, but alert-summary accuracy slipped 13 pts and NOC engineers are bypassing it.",
        brief: {
          whatChanged: "Alert-summary accuracy fell from 89% to 76% after new alarm types landed; engineer usage is dropping.",
          topConcern: "Tracked green on deployment milestones, but accuracy and adoption are both sliding — the milestone view is hiding it.",
          ask: "Fund a 1-sprint accuracy-hardening spike and pause new alarm-type onboarding — decision needed this steering.",
        },
        raid: {
          risks: [{ text: "Engineers abandon the copilot before it earns trust", sev: "high" }],
          assumptions: ["New alarm types fit the existing summarization prompts — proving false"],
          issues: [{ text: "Alert-summary accuracy 76% vs 88% gate", sev: "high" }, { text: "NOC adoption down to 38%", sev: "med" }],
          dependencies: [{ text: "Alarm taxonomy from Network Engineering", sev: "high" }],
        },
      },
      {
        id: "churn", name: "Churn / retention model", owner: "Growth pod",
        reported: "amber", actual: "amber", trend: "up", delta: 6,
        summary: "Recovering: save-offer targeting improved; precision up 6 pts.",
        brief: {
          whatChanged: "Retrained on recent churn cohorts; save-offer precision up 6 pts and wasted incentives down.",
          topConcern: "Refresh cadence is still quarterly; drift risk builds between refreshes.",
          ask: "Approve a monthly refresh cadence — budget note for next steering.",
        },
        raid: {
          risks: [{ text: "Drift between quarterly refreshes erodes precision", sev: "med" }],
          assumptions: ["Churn drivers stay stable quarter to quarter"],
          issues: [{ text: "Refresh cadence still quarterly", sev: "med" }],
          dependencies: [{ text: "Billing + usage feature refresh (Data)", sev: "med" }],
        },
      },
      {
        id: "dispatch", name: "Field-service dispatch optimization", owner: "Field ops pod",
        reported: "red", actual: "red", trend: "down", delta: -8,
        summary: "Known red and worsening: route optimizer over SLA on rural clusters; rollout blocked.",
        brief: {
          whatChanged: "The optimizer is still 25% over the drive-time SLA on rural clusters; two regions are blocked.",
          topConcern: "Rural road and coverage data was under-scoped in discovery — the optimizer can't clear SLA on the long tail.",
          ask: "Decide: launch urban-only now and defer rural, or extend 6 weeks for the data work — steering call today.",
        },
        raid: {
          risks: [{ text: "Regional launch slips again without a scope cut", sev: "high" }],
          assumptions: ["Rural coverage data matched urban quality — proved false"],
          issues: [{ text: "25% over the drive-time SLA on rural clusters", sev: "high" }],
          dependencies: [{ text: "Rural GIS / road data (Vendor)", sev: "high" }],
        },
      },
    ],
  },
];

export const HEALTH_LABEL: Record<Health, string> = { green: "Green", amber: "Amber", red: "Red" };
export const HEALTH_TONE: Record<Health, BadgeTone> = { green: "emerald", amber: "amber", red: "rose" };
export const HEALTH_SCORE: Record<Health, number> = { green: 100, amber: 60, red: 25 };
export const HEALTH_X: Record<Health, number> = { green: 0.82, amber: 0.5, red: 0.2 };
export const TREND_Y: Record<Trend, number> = { up: 0.8, flat: 0.5, down: 0.2 };
export const SEV_TONE: Record<string, BadgeTone> = { high: "rose", med: "amber", low: "slate" };

export const statusWord = (h: Health) => (h === "green" ? "on track" : h === "amber" ? "at risk" : "off track");
export const trendWord = (t: Trend) => (t === "up" ? "improving" : t === "down" ? "deteriorating" : "holding");
export const healthIndex = (ws: Workstream[]) => Math.round(ws.reduce((a, w) => a + HEALTH_SCORE[w.actual], 0) / ws.length);
