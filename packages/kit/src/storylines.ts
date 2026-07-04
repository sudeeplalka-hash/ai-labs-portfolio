// @labs/kit · storylines.ts — the "follow one program end-to-end" layer.
// The labs are instruments; a storyline is the operator using them in sequence on a
// single program. Each step deep-links into a lab (and, where it sharpens the point,
// a specific industry use-case via ?uc=). This is the breadth-plus-judgment artifact:
// not "I built 23 tools," but "here's how they compose into running a program."

import { type IndustryKey, type Provenance, firstHand, studied } from "./industries";

export interface StoryStep {
  labId: string;      // resolves via LAB_ROUTES
  ucId?: string;      // optional: deep-link a specific use-case (?uc=)
  stage: string;      // the question this stage answers
  headline: string;   // what the operator does here
  detail: string;     // 1–2 sentences of judgment
}

export interface Storyline {
  id: string;
  title: string;
  industry: IndustryKey;   // drives the accent
  provenance: Provenance;
  hook: string;            // the one-line premise
  arc: string;             // what the whole journey demonstrates
  steps: StoryStep[];
}

export const STORYLINES: Storyline[] = [
  {
    id: "deliver-disputes-program",
    title: "Deliver a disputes-automation program",
    industry: "financial-services",
    provenance: firstHand,
    hook: "One finserv program, from people-readiness to the boardroom — the full engagement lifecycle.",
    arc: "The same program walked through seven Engagement-Leadership instruments in the order a delivery lead actually hits them: is the org ready, who has to say yes, what will it take, who staffs it, what must be true to ship, is it really on track, and how do I force the decision.",
    steps: [
      { labId: "EL-01", stage: "Is the org ready?", headline: "Gate on people-readiness, not model accuracy", detail: "Score sponsorship, trust, and workflow fit before committing. The model was never the risk — the people who have to trust it were." },
      { labId: "EL-02", stage: "Who has to say yes?", headline: "Map power × interest and catch the sponsor drifting", detail: "A snapshot lies; a trajectory tells the truth. Programs lose sponsors in the silence between meetings, not in them." },
      { labId: "EL-08", stage: "What will it take?", headline: "Estimate three ways and price the unknowns", detail: "Bottom-up, analogous, and PERT disagree — that spread is the conversation. Data-readiness and eval are line items, not surprises." },
      { labId: "EL-03", stage: "Who staffs it?", headline: "Find the skill-shaped bottleneck", detail: "Thirty people isn't thirty people. The plan fails on a specific scarce skill, not on headcount — resolve that gap, not the average." },
      { labId: "EL-05", ucId: "el05-lending-credit-decisioning", stage: "What must be true to ship?", headline: "Design compliance in as the lending overlay", detail: "High-risk and rights-affecting: fair-lending and model-risk stack on the Act. Compliance is a design input at the start, not a gate at the end." },
      { labId: "EL-04", stage: "Is it actually on track?", headline: "See the workstream that reads green but is sinking", detail: "Reported status hides trajectory. Green with a downward arrow is yellow — report the trajectory or get surprised at go-live." },
      { labId: "EL-10", stage: "Force the decision", headline: "Turn the RAID into a board ask", detail: "Consume the same delivery data and reframe it for the room. An exec update that contains no decision request is a diary entry." },
      { labId: "C1-operate", stage: "…then run it", headline: "Week 7: the SLOs stay green while the answers decay", detail: "Day-2 is where programs are won: a stale index, a silent canary slide, and the retrain / re-index / rollback / re-scope call that loops back to the next Frame. Shipping was the middle of the story, not the end." },
    ],
  },
  {
    id: "win-and-mobilize-engagement",
    title: "Win and mobilize a new engagement",
    industry: "consulting",
    provenance: firstHand,
    hook: "From a bid/no-bid call to a mobilized team — the commercial engine behind delivery.",
    arc: "The pursuit-to-mobilization arc a delivery leader owns in a services business: qualify the RFP, estimate what you'll commit to, prove the business case, confirm you can staff it, mobilize without bleeding margin, and build the capability behind it.",
    steps: [
      { labId: "EL-07", stage: "Should we even bid?", headline: "Run bid/no-bid as a portfolio decision", detail: "Compliance matrix, red-team, and a pursuit score. The RFPs you decline fund the ones you win — declining bad work is senior judgment." },
      { labId: "EL-08", stage: "What will we commit to?", headline: "Estimate the scope you're bidding", detail: "Commit to a range, not a point. The bid is only as honest as the estimate under it — and AI work blows up in data and eval." },
      { labId: "C3-5", stage: "Is the business case real?", headline: "Prove payback, NPV, and IRR with ranges", detail: "Single-point ROI is what juniors present; the tornado of ±30% on the drivers is what actually gets funded." },
      { labId: "EL-03", ucId: "el03-consulting-delivery-pod", stage: "Can we staff it?", headline: "Check the delivery pod's scarce skill", detail: "One skill on every engagement's critical path gates the whole book. Staff that, not the headline FTE count." },
      { labId: "EL-09", ucId: "el09-global-si-pod-mobilization", stage: "Mobilize without bleeding margin", headline: "Pre-provision the access that's the real bottleneck", detail: "Offshore client-system clearance is the longest pole and it isn't on the training plan. Start it at signature, not day one." },
      { labId: "EL-06", stage: "Build the capability behind it", headline: "Choose build / hire / partner per gap", detail: "The stack moved faster than the team. Partner for speed on the critical path, build what becomes the edge — the mix is the plan." },
    ],
  },
  {
    id: "stand-up-ai-capability",
    title: "Stand up an enterprise AI capability",
    industry: "financial-services",
    provenance: firstHand,
    hook: "From capital allocation to the board QBR — building an AI function across strategy, architecture, and delivery.",
    arc: "The one journey that spans all three collections: decide what to fund, how to source the platform, what to build it on, how much autonomy is safe, who runs it, how to keep it examinable, and how to report it. Strategy, engineering, and delivery in a single line.",
    steps: [
      { labId: "C3-1", stage: "What do we fund?", headline: "Allocate capital on value × risk", detail: "Twelve initiatives, risk-adjusted ROI, and an explicit kill / scale / hold on each. Capital allocation under uncertainty, nothing scored by a black box." },
      { labId: "C3-4", stage: "Build or buy the platform?", headline: "Score vendors, then price the concentration risk", detail: "Move the weights and the ranking flips — that fragility is the point. The scorecard picks the vendor; the concentration view says what it costs to be wrong." },
      { labId: "GAP-07", stage: "What architecture?", headline: "Choose function-calling, MCP, A2A, or hybrid", detail: "Six questions, a recommendation, the runner-up, and the flip condition. Showing what flips the call is what makes it architecture judgment, not a quiz." },
      { labId: "GAP-08", stage: "How much autonomy is safe?", headline: "Set the human-in-the-loop level per risk tier", detail: "Raise autonomy and throughput climbs — until an engineered edge case slips through. Autonomy is set per risk tier, not per enthusiasm." },
      { labId: "EL-06", ucId: "el06-bank-ai-coe", stage: "Who runs it?", headline: "Staff the CoE where accountability can't be rented", detail: "In a bank, governance and model-risk carry the highest bars and can't be partnered out. Build or hire there; partner only where speed is safe." },
      { labId: "EL-05", ucId: "el05-lending-credit-decisioning", stage: "Keep it examinable", headline: "Layer the fair-lending and model-risk controls", detail: "The sectoral overlay is examined before the Act. Design the reason codes, bias testing, and SR 11-7 controls in from the start." },
      { labId: "EL-10", ucId: "el10-bank-board-qbr", stage: "Report it to the board", headline: "Run the QBR that ends in a decision", detail: "Reframe the whole program for the board and drive to the two calls only they can make. A board read-out that asks for nothing wasted the room." },
    ],
  },
];
