// EL-02 · Stakeholder & Sponsor Alignment Cockpit, use cases.
// Payload = a full stakeholder landscape for a different program (same shape EL-02
// renders): power/interest coordinates + a 6-week sentiment trajectory + a
// pre-steering briefing per stakeholder. Sentiment scale 0..4 = Blocker→Champion.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface El02SH {
  key: string; name: string; role: string; power: number; interest: number; traj: number[];
  brief: { why: string; who: string; message: string; before: string };
}
export interface El02Payload {
  stakeholders: El02SH[];
  drivingLine: string; // replaces the "…including the sponsor" tail of the intro
}

export const EL02_USE_CASES: UseCase<El02Payload>[] = assertUseCases<El02Payload>([
  {
    id: "el02-public-sector-citizen-services",
    labId: "EL-02",
    industry: "public-sector",
    provenance: studied,
    title: "Citizen-services automation program",
    oneLiner: "The sponsoring CIO cools while a records officer quietly gains gate power.",
    context:
      "A government agency automating citizen-service intake. The elected-oversight and workforce dimensions make alignment the program's hardest surface, the records officer can stall it at the privacy gate, and the sponsor is exposed to procurement scrutiny.",
    theDecision:
      "Read the trajectory, not the org chart: the CIO's cooling and the records officer's rising gate-power are invisible on a status report and decide whether this program ships.",
    whatMostMiss:
      "In public-sector programs the blocker isn't the loud skeptic, it's the quiet statutory gatekeeper (privacy, records, procurement) whose sign off is mandatory. Map power as gate-authority, not seniority.",
    stakes: "Miss the records officer's drift and the program stalls at the privacy gate with no recovery path.",
    takeaway: "In government programs, power means statutory gate-authority, map the gatekeepers or get stalled.",
    sources: [
      "Public-sector delivery, stakeholder & oversight mapping (studied)",
      "Government privacy/records gate dynamics",
    ],
    lastVerified: "2026-07-03",
    payload: {
      drivingLine: "and the sponsoring CIO is drifting while the records officer gains gate power.",
      stakeholders: [
        { key: "cio", name: "Agency CIO (sponsor)", role: "Manage closely", power: 0.9, interest: 0.8, traj: [4, 4, 3, 3, 2, 2],
          brief: { why: "Procurement scrutiny landed and no win has been shared in three weeks; champion energy is cooling.", who: "You, in a 1:1 before the oversight briefing.", message: "Bring the intake-time reduction and the single procurement clarification you need; re-anchor the mandate.", before: "This week, before oversight prep." } },
        { key: "prog", name: "Program director", role: "Manage closely", power: 0.75, interest: 0.9, traj: [3, 3, 3, 3, 3, 3],
          brief: { why: "Steady owner of the outcome and the delivery floor.", who: "Delivery lead, weekly.", message: "Keep sharing throughput; ask them to co-present at the oversight briefing.", before: "In the weekly." } },
        { key: "records", name: "Chief Records/Privacy Officer", role: "Keep satisfied", power: 0.85, interest: 0.55, traj: [2, 2, 1, 1, 1, 1],
          brief: { why: "Skeptical since the data-retention question went unanswered; holds a mandatory gate.", who: "You + counsel, ahead of the gate.", message: "Walk the retention schedule and audit-logging design; convert the objection into a control they own.", before: "Before the privacy gate review." } },
        { key: "union", name: "Workforce / union rep", role: "Keep informed", power: 0.5, interest: 0.85, traj: [3, 2, 2, 2, 3, 3],
          brief: { why: "Anxious about caseworker displacement; a mid-program wobble, now recovering.", who: "Change lead, on-site.", message: "Reaffirm the augment-not-replace model and the reskilling commitment; surface a caseworker win.", before: "This week." } },
        { key: "legis", name: "Legislative liaison", role: "Keep satisfied", power: 0.7, interest: 0.5, traj: [2, 2, 2, 2, 2, 2],
          brief: { why: "Neutral, cost-and-optics focused; wants the taxpayer-value story.", who: "You, with the cost-per-case figure.", message: "Share cost-per-case and the equity-of-access safeguards; pre-empt the optics question.", before: "With the oversight pre-read." } },
        { key: "vendor", name: "Vendor delivery lead", role: "Keep informed", power: 0.5, interest: 0.9, traj: [4, 4, 4, 4, 4, 4],
          brief: { why: "Champion, closest to the build.", who: "Peer-to-peer.", message: "Use them to co-present and to reach the records officer's technical staff.", before: "Ongoing." } },
        { key: "field", name: "Field office manager", role: "Keep informed", power: 0.3, interest: 0.8, traj: [3, 3, 3, 3, 3, 3],
          brief: { why: "Supportive; carries the frontline sentiment.", who: "Change lead.", message: "Equip with the queue-time win to broadcast; keep the feedback loop visible.", before: "Ongoing." } },
      ],
    },
  },
  {
    id: "el02-pharma-rd-discovery",
    labId: "EL-02",
    industry: "pharma",
    provenance: studied,
    title: "R&D discovery-informatics program",
    oneLiner: "Regulatory/QA is the gate; bench-scientist trust is the adoption you can't mandate.",
    context:
      "An AI program in drug-discovery informatics. Two alignment axes decide it: GxP/validation sign off from Regulatory-QA (a hard gate), and the trust of bench scientists who will simply ignore a tool they don't believe.",
    theDecision:
      "Two gates, not one: the Regulatory-QA validation gate is formal and the bench-scientist trust gate is informal, miss either and the program is shelved regardless of model quality.",
    whatMostMiss:
      "Teams optimize for the sponsor and forget scientists can't be ordered to trust a model. In R&D, informal adoption authority outweighs org power, the bench decides in practice.",
    stakes: "Win Regulatory but lose the bench and the tool ships to an empty room; win the bench but skip validation and it never ships.",
    takeaway: "In pharma R&D, bench-scientist trust is an adoption gate you can't mandate, court it like the formal one.",
    sources: [
      "Pharma R&D informatics, stakeholder mapping (studied)",
      "GxP validation and bench-adoption dynamics",
    ],
    lastVerified: "2026-07-03",
    payload: {
      drivingLine: "and both the R&D sponsor and the QA gate are drifting toward skeptic.",
      stakeholders: [
        { key: "rd", name: "Head of R&D (sponsor)", role: "Manage closely", power: 0.9, interest: 0.8, traj: [4, 3, 3, 2, 2, 2],
          brief: { why: "Cooling after a validation concern surfaced at a portfolio review; needs reassurance the science holds.", who: "You, in a 1:1 before the portfolio review.", message: "Bring the retrospective-validation results and the one decision you need; re-anchor on cycle time.", before: "Before the next portfolio review." } },
        { key: "ta", name: "Therapeutic-area lead", role: "Manage closely", power: 0.75, interest: 0.9, traj: [3, 3, 3, 3, 3, 3],
          brief: { why: "Steady owner of the scientific outcome.", who: "Delivery lead, weekly.", message: "Keep sharing hit-rate signal; ask them to sponsor a bench pilot.", before: "In the weekly." } },
        { key: "qa", name: "Head of Regulatory / QA", role: "Keep satisfied", power: 0.85, interest: 0.5, traj: [2, 2, 2, 1, 1, 1],
          brief: { why: "Skeptical on GxP validation and model change-control; holds a mandatory gate.", who: "You + validation lead, ahead of the gate.", message: "Walk the validation protocol and change-control design; convert the objection into a documented control.", before: "Before the validation gate." } },
        { key: "cdo", name: "Chief Data Officer", role: "Keep satisfied", power: 0.65, interest: 0.7, traj: [3, 3, 3, 3, 3, 3],
          brief: { why: "Supportive; cares about data lineage and reuse.", who: "You.", message: "Show the lineage and provenance capture; enlist them on data-access.", before: "With the pre-read." } },
        { key: "bench", name: "Bench-scientist lead", role: "Keep informed", power: 0.45, interest: 0.9, traj: [3, 2, 2, 2, 2, 2],
          brief: { why: "Trust wobbled after an early false lead; holds informal adoption authority the org chart hides.", who: "Delivery lead + a respected peer scientist.", message: "Sit at the bench; show interpretability and the confidence signal; let a trusted scientist validate one result publicly.", before: "This week, before belief hardens." } },
        { key: "info", name: "Informatics delivery lead", role: "Keep informed", power: 0.5, interest: 0.9, traj: [4, 4, 4, 4, 4, 4],
          brief: { why: "Champion, closest to the pipeline.", who: "Peer.", message: "Use them to co-present validation and to reach the bench.", before: "Ongoing." } },
        { key: "fin", name: "R&D finance partner", role: "Keep informed", power: 0.55, interest: 0.6, traj: [2, 2, 2, 2, 2, 2],
          brief: { why: "Neutral; wants the cost-per-program story.", who: "You, with the economics.", message: "Share the cycle time-to-cost translation; pre-empt the spend question.", before: "With the pre-read." } },
      ],
    },
  },
  {
    id: "el02-capital-markets-wealth-platform",
    labId: "EL-02",
    industry: "capital-markets",
    provenance: firstHand,
    title: "Wealth-platform advisor-assist program",
    oneLiner: "Compliance can veto; the field advisor council decides whether it's ever used.",
    context:
      "An advisor-assist and research-synthesis platform for a wealth-management business. Compliance holds a suitability/records veto, and the field advisor council, thousands of advisors, decides adoption in practice. Both must be aligned, and they pull in different directions.",
    theDecision:
      "Compliance veto vs. field adoption: the Chief Compliance Officer can block on suitability and records, while the advisor council can silently refuse, the program needs the control CCO wants and the workflow advisors will actually use.",
    whatMostMiss:
      "Programs court the executive sponsor and under-invest in the field council, then wonder why adoption stalls. In advisor platforms, the field's informal veto is as real as compliance's formal one.",
    stakes: "Skip compliance and the platform is shut down at review; skip the field council and it's built, launched, and ignored.",
    takeaway: "On advisor platforms, align the compliance veto and the field's silent veto, both can kill it.",
    sources: [
      "Wealth-platform delivery, stakeholder alignment (firsthand, capital markets)",
      "Advisor-adoption and suitability-compliance dynamics",
    ],
    lastVerified: "2026-07-03",
    payload: {
      drivingLine: "and the platform sponsor and the CISO are both drifting toward skeptic.",
      stakeholders: [
        { key: "sponsor", name: "Head of Wealth Platform (sponsor)", role: "Manage closely", power: 0.9, interest: 0.85, traj: [4, 4, 3, 3, 2, 2],
          brief: { why: "Two quiet weeks and a peer flagged advisor-adoption risk; champion energy is cooling to neutral.", who: "You, in a 1:1 before the steering.", message: "Bring the pilot-desk adoption number and the single decision you need; re-anchor on advisor productivity.", before: "48 hours before the pre-read." } },
        { key: "advisory", name: "Head of Advisory (business owner)", role: "Manage closely", power: 0.8, interest: 0.9, traj: [3, 3, 3, 3, 3, 3],
          brief: { why: "Steady owner of the advisor outcome and the field relationship.", who: "Delivery lead, weekly.", message: "Keep sharing time-saved-per-advisor; ask them to open a door to the field council.", before: "In the weekly." } },
        { key: "cco", name: "Chief Compliance Officer", role: "Keep satisfied", power: 0.85, interest: 0.55, traj: [2, 2, 1, 1, 1, 1],
          brief: { why: "Skeptical on suitability and records-retention for AI-assisted advice; holds a veto at review.", who: "You + delivery lead, ahead of the review.", message: "Walk the supervision workflow, disclosure design, and the human-approval control; convert the objection into a control CCO owns.", before: "This week, before the compliance review." } },
        { key: "research", name: "Head of Research", role: "Keep satisfied", power: 0.65, interest: 0.7, traj: [3, 3, 3, 3, 3, 3],
          brief: { why: "Supportive; cares about attribution and not diluting the research brand.", who: "You.", message: "Show source attribution and the analyst-in-the-loop design; enlist as a credibility voice.", before: "With the pre-read." } },
        { key: "council", name: "Field advisor council rep", role: "Keep informed", power: 0.45, interest: 0.9, traj: [3, 2, 2, 2, 2, 2],
          brief: { why: "Anxious that it's compliance surveillance, not a productivity tool; holds the field's informal veto.", who: "Delivery lead + a respected senior advisor.", message: "Demo the time it gives back in the advisor's own workflow; let a trusted advisor champion it to peers.", before: "This week, field belief is forming now." } },
        { key: "platform", name: "Platform delivery lead", role: "Keep informed", power: 0.5, interest: 0.9, traj: [4, 4, 4, 4, 4, 4],
          brief: { why: "Champion, closest to the build.", who: "Peer.", message: "Use them to co-present the supervision design and to reach the field council.", before: "Ongoing." } },
        { key: "ciso", name: "CISO", role: "Keep satisfied", power: 0.6, interest: 0.55, traj: [2, 2, 2, 1, 1, 1],
          brief: { why: "Drifting to skeptic after the client-data-flow review raised questions.", who: "You + delivery lead.", message: "Bring the data-handling, tenancy, and logging design; close the open items in writing.", before: "Before the security gate." } },
      ],
    },
  },
]);
