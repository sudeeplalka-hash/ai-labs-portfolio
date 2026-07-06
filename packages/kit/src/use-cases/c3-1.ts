// C3-1 · AI Initiative Portfolio Dashboard, use cases.
// Payload = an industry-specific book of ~12 initiatives the dashboard scores with
// the SAME risk adjusted-ROI engine. Numbers are tuned so each book yields a
// believable kill/scale/hold spread (2 kills, ~3 scale, rest hold).

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export type C31Stage = "discovery" | "pilot" | "scaling" | "production";
export interface C31Initiative {
  id: string; name: string; domain: string; stage: C31Stage;
  expValueM: number; spendM: number; risk: number; planVar: number;
}
export interface C31Payload {
  initiatives: C31Initiative[];
}

export const C31_USE_CASES: UseCase<C31Payload>[] = assertUseCases<C31Payload>([
  {
    id: "c31-retail-bank",
    labId: "C3-1",
    industry: "financial-services",
    provenance: firstHand,
    title: "A retail bank's AI book",
    oneLiner: "Cards, fraud, KYC, wealth, governed like capital; two get cut.",
    context:
      "A retail bank runs twelve AI initiatives across cards, fraud, lending, and wealth. Each competes for the same delivery capacity and cloud budget; leadership wants a defensible kill/scale/hold call, not a champion's wish-list.",
    theDecision:
      "Fund on risk adjusted ROI, not enthusiasm, the KYC pilot and the collections assist both destroy value at their current stage and should be cut to feed the two that are ready to scale.",
    whatMostMiss:
      "The hard call isn't what to scale, it's killing a well-liked pilot. A portfolio where nothing is ever killed isn't governed; it's unattended.",
    stakes: "Two negative-ROI initiatives hold the delivery capacity the scale-ready ones need, the cost of not deciding is the opportunity cost.",
    takeaway: "I govern the AI book like capital: fund the ROI, kill the theatre, and make the call visible.",
    sources: [
      "Financial-services AI portfolio governance, firsthand (cards & payments, American Express)",
      "Stage-gated capital-allocation practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      initiatives: [
        { id: "servicing", name: "Card-member servicing assist", domain: "Cards", stage: "production", expValueM: 3.2, spendM: 0.9, risk: 0.25, planVar: 4 },
        { id: "disputes", name: "Disputes automation", domain: "Cards", stage: "scaling", expValueM: 2.1, spendM: 1.1, risk: 0.55, planVar: 12 },
        { id: "fraud", name: "Fraud alert triage", domain: "Risk", stage: "production", expValueM: 4.0, spendM: 1.2, risk: 0.30, planVar: -3 },
        { id: "kyc", name: "KYC document intelligence", domain: "Onboarding", stage: "pilot", expValueM: 1.4, spendM: 1.1, risk: 0.75, planVar: 18 },
        { id: "creditline", name: "Credit-line optimization", domain: "Lending", stage: "scaling", expValueM: 2.4, spendM: 0.9, risk: 0.45, planVar: 6 },
        { id: "collections", name: "Collections outreach assist", domain: "Lending", stage: "pilot", expValueM: 1.1, spendM: 0.7, risk: 0.65, planVar: 10 },
        { id: "statements", name: "Statements Q&A assistant", domain: "Servicing", stage: "scaling", expValueM: 1.6, spendM: 0.6, risk: 0.50, planVar: 5 },
        { id: "aml", name: "AML transaction monitoring", domain: "Risk", stage: "production", expValueM: 3.0, spendM: 1.0, risk: 0.40, planVar: -2 },
        { id: "wealth", name: "Wealth ops copilot", domain: "Wealth", stage: "scaling", expValueM: 1.8, spendM: 0.8, risk: 0.50, planVar: 6 },
        { id: "nba", name: "Marketing next-best-action", domain: "Growth", stage: "scaling", expValueM: 2.2, spendM: 0.9, risk: 0.55, planVar: 8 },
        { id: "agentassist", name: "Contact center agent assist", domain: "Servicing", stage: "production", expValueM: 2.6, spendM: 0.75, risk: 0.35, planVar: 3 },
        { id: "complaints", name: "Complaint analytics", domain: "Risk", stage: "scaling", expValueM: 1.6, spendM: 0.7, risk: 0.50, planVar: 11 },
      ],
    },
  },
  {
    id: "c31-health-system",
    labId: "C3-1",
    industry: "healthcare",
    provenance: studied,
    title: "A health system's AI book",
    oneLiner: "Clinical and admin AI, allocated under one lens.",
    context:
      "A health system weighs twelve initiatives spanning clinical (scribe, sepsis warning, imaging) and administrative (prior-auth, revenue-cycle coding, denials). Clinical value is real but slower to prove; admin value is faster and fundable now.",
    theDecision:
      "Revenue-cycle coding and denials management scale now, proven and high risk adjusted ROI; the imaging-triage and bed-management pilots are cut, high spend, unproven, and the clinical-safety bar makes the ramp long.",
    whatMostMiss:
      "Clinical prestige biases the book toward glamorous pilots. The risk adjusted math usually says the unglamorous admin automation funds the clinical ambition.",
    stakes: "Mis-allocating toward slow clinical pilots starves the admin automations that actually pay for the program.",
    takeaway: "Same instrument, clinical book: the admin ROI often funds the clinical ambition.",
    sources: [
      "Health-system AI initiative patterns (clinical + revenue-cycle)",
      "Provider AI ROI and safety-ramp literature",
    ],
    lastVerified: "2026-07-03",
    payload: {
      initiatives: [
        { id: "scribe", name: "Ambient clinical scribe", domain: "Clinical", stage: "scaling", expValueM: 3.4, spendM: 1.0, risk: 0.45, planVar: 6 },
        { id: "imaging", name: "Imaging triage (radiology)", domain: "Clinical", stage: "pilot", expValueM: 2.0, spendM: 1.2, risk: 0.70, planVar: 15 },
        { id: "priorauth", name: "Prior-authorization automation", domain: "Admin", stage: "scaling", expValueM: 2.8, spendM: 0.9, risk: 0.40, planVar: 5 },
        { id: "bedmgmt", name: "Bed-management optimization", domain: "Ops", stage: "pilot", expValueM: 1.3, spendM: 0.8, risk: 0.65, planVar: 12 },
        { id: "sepsis", name: "Sepsis early-warning", domain: "Clinical", stage: "production", expValueM: 3.0, spendM: 0.9, risk: 0.35, planVar: -2 },
        { id: "discharge", name: "Discharge-summary drafting", domain: "Clinical", stage: "scaling", expValueM: 1.8, spendM: 0.7, risk: 0.50, planVar: 7 },
        { id: "rcm", name: "Revenue-cycle coding assist", domain: "Admin", stage: "production", expValueM: 3.6, spendM: 1.0, risk: 0.35, planVar: 3 },
        { id: "messaging", name: "Patient-message triage", domain: "Admin", stage: "scaling", expValueM: 1.6, spendM: 0.8, risk: 0.55, planVar: 9 },
        { id: "radreport", name: "Radiology report drafting", domain: "Clinical", stage: "scaling", expValueM: 2.0, spendM: 0.8, risk: 0.55, planVar: 14 },
        { id: "staffing", name: "Nurse-staffing forecast", domain: "Ops", stage: "scaling", expValueM: 2.0, spendM: 0.7, risk: 0.45, planVar: 4 },
        { id: "trialmatch", name: "Clinical-trial matching", domain: "Research", stage: "scaling", expValueM: 1.6, spendM: 0.6, risk: 0.55, planVar: 16 },
        { id: "denials", name: "Denials management", domain: "Admin", stage: "production", expValueM: 2.8, spendM: 0.85, risk: 0.40, planVar: 2 },
      ],
    },
  },
  {
    id: "c31-manufacturer",
    labId: "C3-1",
    industry: "manufacturing",
    provenance: studied,
    title: "A manufacturer's AI book",
    oneLiner: "Predictive maintenance to procurement, where the money actually is.",
    context:
      "An industrial manufacturer runs twelve AI initiatives across plant (predictive maintenance, energy), quality (defect vision), and supply (demand, supply-risk). The plant-floor bets compound with uptime; the discovery-stage ideas burn budget with no line of sight.",
    theDecision:
      "Predictive maintenance, supply-risk monitoring, and spare-parts optimization scale; the procurement copilot and the quality-doc assistant are cut, early-stage, thin ROI, and no near-term path.",
    whatMostMiss:
      "The flashy generative pilots (doc assistants, digital twins) rarely top the risk adjusted list; boring predictive maintenance usually does. Fund the boring compounder.",
    stakes: "Uptime is the P&L lever; funding discovery toys over predictive maintenance leaves real margin on the floor.",
    takeaway: "Same instrument, industrial book: the boring uptime bet usually beats the shiny pilot.",
    sources: [
      "Industrial AI portfolio patterns (predictive maintenance, defect vision, demand)",
      "OEE and uptime ROI practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      initiatives: [
        { id: "predmaint", name: "Predictive maintenance", domain: "Plant", stage: "production", expValueM: 3.5, spendM: 1.0, risk: 0.35, planVar: 4 },
        { id: "defect", name: "Defect-detection vision", domain: "Quality", stage: "scaling", expValueM: 2.6, spendM: 0.9, risk: 0.45, planVar: 7 },
        { id: "demand", name: "Demand forecasting", domain: "Supply", stage: "scaling", expValueM: 2.2, spendM: 0.8, risk: 0.50, planVar: 8 },
        { id: "procurement", name: "Procurement copilot", domain: "Sourcing", stage: "pilot", expValueM: 1.3, spendM: 0.9, risk: 0.70, planVar: 15 },
        { id: "energy", name: "Energy optimization", domain: "Plant", stage: "scaling", expValueM: 1.9, spendM: 0.7, risk: 0.50, planVar: 6 },
        { id: "qdocs", name: "Quality-doc assistant", domain: "Quality", stage: "discovery", expValueM: 0.8, spendM: 0.6, risk: 0.65, planVar: 10 },
        { id: "supplyrisk", name: "Supply-risk monitor", domain: "Supply", stage: "production", expValueM: 3.0, spendM: 0.85, risk: 0.40, planVar: 2 },
        { id: "scheduling", name: "Shop-floor scheduling", domain: "Ops", stage: "scaling", expValueM: 2.0, spendM: 0.8, risk: 0.55, planVar: 9 },
        { id: "safety", name: "Safety-incident analytics", domain: "EHS", stage: "scaling", expValueM: 1.6, spendM: 0.7, risk: 0.50, planVar: 11 },
        { id: "spares", name: "Spare-parts optimization", domain: "Supply", stage: "production", expValueM: 2.4, spendM: 0.7, risk: 0.45, planVar: 3 },
        { id: "twin", name: "Digital-twin assist", domain: "Engineering", stage: "scaling", expValueM: 1.6, spendM: 0.7, risk: 0.60, planVar: 18 },
        { id: "warranty", name: "Warranty analytics", domain: "Quality", stage: "scaling", expValueM: 1.8, spendM: 0.75, risk: 0.50, planVar: 7 },
      ],
    },
  },
]);
