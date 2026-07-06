// EL-10 · Executive Communication Studio, use cases.
// Payload = an industry delivery portfolio (same shape EL-10 consumes) + a default
// artifact and audience. The audience-reframing demo stays interactive; the use case
// sets the industry data and the framing the brief explains (board / partner / plant).

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export type El10Health = "green" | "amber" | "red";
export type El10Trend = "up" | "flat" | "down";
export interface El10RaidItem { text: string; sev?: "high" | "med" | "low" }
export interface El10Workstream {
  id: string;
  name: string;
  owner: string;
  reported: El10Health;
  actual: El10Health;
  trend: El10Trend;
  delta: number;
  summary: string;
  brief: { whatChanged: string; topConcern: string; ask: string };
  raid: { risks: El10RaidItem[]; assumptions: string[]; issues: El10RaidItem[]; dependencies: El10RaidItem[] };
}
export interface El10Scenario {
  key: string;
  label: string;
  note: string;
  adoptionIndex: number;
  burnVariance: number;
  workstreams: El10Workstream[];
}
export interface El10Payload {
  portfolio: El10Scenario;
  defaultArtifact: "weekly" | "steering" | "qbr";
  defaultAud: "cio" | "sponsor" | "procurement";
}

export const EL10_USE_CASES: UseCase<El10Payload>[] = assertUseCases<El10Payload>([
  {
    id: "el10-bank-board-qbr",
    labId: "EL-10",
    industry: "financial-services",
    provenance: firstHand,
    title: "Board QBR on the AI program",
    oneLiner: "A board read-out that ends in the two decisions only the board can make.",
    context:
      "A quarterly board read-out on the bank's AI program. The board doesn't need the delivery detail, it needs the risk posture, the ROI to date, and the two decisions that need board air-cover.",
    theDecision:
      "Force the decision: a board QBR reframed to lead with risk and the decisions, not a status tour, every section drives toward the two asks the board must actually rule on.",
    whatMostMiss:
      "Teams bring the board a status deck and leave without a decision. A board's time is the scarcest in the company; a read-out that asks for nothing wasted it.",
    stakes: "A board QBR with no decision request means the program's blockers wait another quarter for air-cover.",
    takeaway: "A board QBR that doesn't ask the board to decide wasted the room's time.",
    sources: [
      "Board-level AI-program reporting, firsthand (financial services)",
      "Decision-forcing executive communication practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      defaultArtifact: "qbr",
      defaultAud: "cio",
      portfolio: {
        key: "bank-program",
        label: "Bank AI program",
        note: "Enterprise fraud, card servicing, KYC, finserv, board view, illustrative.",
        adoptionIndex: 62,
        burnVariance: 5,
        workstreams: [
          {
            id: "fraud", name: "Enterprise fraud platform", owner: "Fraud CoE",
            reported: "amber", actual: "amber", trend: "up", delta: 8,
            summary: "Recovering: false positives down 8 pts; run-rate savings ahead of plan.",
            brief: { whatChanged: "Threshold retune cut false positives 8 pts; annualized savings ahead of plan.", topConcern: "Drift monitoring still manual, recovery is fragile.", ask: "Approve the drift-monitor automation budget, decision needed by Friday." },
            raid: { risks: [{ text: "Drift recurs without automated monitoring", sev: "high" }], assumptions: ["Analyst capacity holds through Q3"], issues: [{ text: "Manual weekly drift check", sev: "med" }], dependencies: [{ text: "Feature-store refresh cadence (Data)", sev: "med" }] },
          },
          {
            id: "servicing", name: "Card-servicing assist", owner: "Servicing pod",
            reported: "green", actual: "green", trend: "flat", delta: 0,
            summary: "Containment steady at ~22%; CSAT holding.",
            brief: { whatChanged: "Steady quarter; containment held.", topConcern: "Peak-season ramp ahead.", ask: "None this forum, FYI." },
            raid: { risks: [], assumptions: ["Contact mix stays within seasonal norms"], issues: [], dependencies: [] },
          },
          {
            id: "kyc", name: "KYC / onboarding intelligence", owner: "KYC pod",
            reported: "red", actual: "red", trend: "flat", delta: 0,
            summary: "Known red: extraction below bar on non-standard documents.",
            brief: { whatChanged: "No movement; accuracy stuck below the launch bar on the document long tail.", topConcern: "Data-readiness discovery was under-scoped.", ask: "Decide: narrow to the top-5 document types for launch, or extend the timeline 6 weeks, steering call today." },
            raid: { risks: [{ text: "Timeline slips again without a scope cut", sev: "high" }], assumptions: ["Pilot document mix was representative, proved false"], issues: [{ text: "Extraction below the launch bar on the long tail", sev: "high" }], dependencies: [{ text: "Compliance sign off on reduced scope (Risk)", sev: "high" }] },
          },
        ],
      },
    },
  },
  {
    id: "el10-profservices-partner",
    labId: "EL-10",
    industry: "consulting",
    provenance: firstHand,
    title: "Partner update on the firm's AI capability",
    oneLiner: "A partner read-out that leads with the investment decisions, not the build status.",
    context:
      "An update to partner leadership on the firm's own AI delivery capability. Partners want the utilization impact and the investment decisions to greenlight, not a tour of what the capability team built.",
    theDecision:
      "Decisions, not status: reframe the capability update to lead with the two investment asks and the utilization impact, because that's what partners actually vote on.",
    whatMostMiss:
      "Capability teams present partners a build-status update. Partners skim it, they engage with utilization economics and the investment decisions, so lead there.",
    stakes: "A capability update that reads as status gets deferred; the investment it needed waits another quarter.",
    takeaway: "To partners, lead with the investment decisions, a capability status report gets skimmed.",
    sources: [
      "Professional-services AI capability reporting, firsthand (consulting delivery)",
      "Partner-audience executive communication framing",
    ],
    lastVerified: "2026-07-03",
    payload: {
      defaultArtifact: "steering",
      defaultAud: "sponsor",
      portfolio: {
        key: "profservices-capability",
        label: "Firm AI delivery capability",
        note: "Delivery accelerators, knowledge assistant, proposal automation, professional services, illustrative.",
        adoptionIndex: 51,
        burnVariance: 3,
        workstreams: [
          {
            id: "accel", name: "Client-delivery accelerators", owner: "Delivery CoE",
            reported: "green", actual: "green", trend: "up", delta: 9,
            summary: "Accelerators cutting delivery hours on repeatable workstreams; utilization impact real.",
            brief: { whatChanged: "Pilot engagements report a meaningful cut in delivery hours on repeatable work.", topConcern: "Only three practices onboarded; the impact is capacity-bound.", ask: "Approve scaling the accelerator team to onboard two more practices, decision needed this steering." },
            raid: { risks: [{ text: "Impact stays capacity-bound without more accelerator engineers", sev: "high" }], assumptions: ["Repeatable-work share holds across practices"], issues: [], dependencies: [{ text: "Practice-lead sponsorship (Partners)", sev: "med" }] },
          },
          {
            id: "km", name: "Internal knowledge assistant", owner: "Knowledge team",
            reported: "green", actual: "amber", trend: "down", delta: -9,
            summary: "Reads green on rollout, but consultant usage is sliding as the knowledge base goes stale.",
            brief: { whatChanged: "Usage fell as answers referenced outdated methodology; consultants reverted to asking colleagues.", topConcern: "Green on rollout, but adoption is quietly reversing, content freshness is the gap.", ask: "Fund a knowledge-refresh sprint and an ownership model for content, decision needed by Friday." },
            raid: { risks: [{ text: "Assistant is abandoned if content freshness isn't owned", sev: "high" }], assumptions: ["Practices would keep content current, proving false"], issues: [{ text: "Consultant usage sliding", sev: "med" }], dependencies: [{ text: "Content ownership per practice (Partners)", sev: "med" }] },
          },
          {
            id: "proposals", name: "Proposal automation", owner: "Growth team",
            reported: "amber", actual: "amber", trend: "up", delta: 5,
            summary: "Recovering: draft-quality up after tuning; turnaround improving.",
            brief: { whatChanged: "Proposal draft quality up after tuning; turnaround improving.", topConcern: "Win-rate impact not yet measurable.", ask: "None, trending the right way." },
            raid: { risks: [{ text: "Win-rate impact stays unproven", sev: "med" }], assumptions: ["Proposal volume holds"], issues: [], dependencies: [] },
          },
        ],
      },
    },
  },
  {
    id: "el10-manufacturer-plant",
    labId: "EL-10",
    industry: "manufacturing",
    provenance: studied,
    title: "Plant-leadership update tying AI to OEE",
    oneLiner: "Everything framed in OEE, the metric plant leadership actually owns.",
    context:
      "A weekly update to plant leadership on the AI program. Plant leaders think in OEE (availability × performance × quality); the update reframes every workstream as its OEE impact and the floor decisions that move it.",
    theDecision:
      "Speak the audience's metric: reframe delivery status as OEE impact, uptime, throughput, scrap, so plant leadership sees the program in the language they run the floor in.",
    whatMostMiss:
      "Program teams report model metrics to plant leaders who think in OEE. Translate to uptime and scrap or the update doesn't land on the floor.",
    stakes: "An update in AI metrics rather than OEE gets nods and no action from plant leadership.",
    takeaway: "To plant leadership, frame everything in OEE, that's the metric they own.",
    sources: [
      "Manufacturing AI program reporting (OEE framing)",
      "Audience-metric translation in executive communication",
    ],
    lastVerified: "2026-07-03",
    payload: {
      defaultArtifact: "weekly",
      defaultAud: "sponsor",
      portfolio: {
        key: "manufacturer-oee",
        label: "Plant AI program (OEE)",
        note: "Predictive maintenance, defect vision, scheduling, manufacturing, OEE view, illustrative.",
        adoptionIndex: 57,
        burnVariance: 7,
        workstreams: [
          {
            id: "predmaint", name: "Predictive maintenance", owner: "Reliability pod",
            reported: "green", actual: "green", trend: "up", delta: 6,
            summary: "Unplanned downtime down; availability (the A in OEE) up ~2 pts.",
            brief: { whatChanged: "Unplanned downtime down on two lines; availability up ~2 pts.", topConcern: "Sensor coverage gaps on older assets.", ask: "None this update, FYI, availability trending up." },
            raid: { risks: [{ text: "Coverage gaps limit further availability gains", sev: "med" }], assumptions: ["Sensor retrofit stays on schedule"], issues: [], dependencies: [{ text: "Sensor retrofit (Maintenance)", sev: "low" }] },
          },
          {
            id: "defect", name: "Defect-detection vision", owner: "Quality pod",
            reported: "amber", actual: "red", trend: "down", delta: -12,
            summary: "Reads amber, but a line-integration failure is stalling the quality (Q) gains.",
            brief: { whatChanged: "Vision model is accurate offline, but the line-PLC integration keeps dropping, no live quality impact yet.", topConcern: "The blocker is integration, not the model; quality (the Q in OEE) is flat as a result.", ask: "Escalate the line-PLC integration blocker to Controls Engineering, steering call today." },
            raid: { risks: [{ text: "Quality gains stall indefinitely on the integration blocker", sev: "high" }], assumptions: ["PLC integration would be straightforward, proved false"], issues: [{ text: "Line-PLC integration dropping frames", sev: "high" }], dependencies: [{ text: "Controls Engineering (OT)", sev: "high" }] },
          },
          {
            id: "scheduling", name: "Shop-floor scheduling", owner: "Ops pod",
            reported: "amber", actual: "amber", trend: "flat", delta: 0,
            summary: "Holding: performance (P) gains on line 1; expansion pending.",
            brief: { whatChanged: "Throughput up on line 1; other lines not yet enabled.", topConcern: "Expanding before line 1 is stable risks both.", ask: "Decide: expand scheduling to line 3 now, or stabilize line 1 first, this steering." },
            raid: { risks: [{ text: "Premature expansion destabilizes line 1", sev: "med" }], assumptions: ["Line 1 pattern generalizes"], issues: [{ text: "Only line 1 enabled", sev: "low" }], dependencies: [{ text: "MES integration for line 3 (IT)", sev: "med" }] },
          },
        ],
      },
    },
  },
]);
