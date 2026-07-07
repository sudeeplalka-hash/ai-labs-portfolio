// C3-4 · Vendor Evaluation & Risk Monitor, use cases.
// Payload = a weighting preset (the industry's constraints expressed as weights).
// Same three archetype vendors + scorecard engine; the weights flip the ranking, // which is exactly the point ("constraints as weights"). Pharma → specialist rises;
// education & public sector → open-source-backed rises on portability/low-lock-in.

import { type UseCase, assertUseCases, studied } from "../industries";

export type C34CKey = "capability" | "security" | "roadmap" | "lockin" | "support" | "price";
export type C34Weights = Record<C34CKey, number>;
export interface C34Payload {
  weights: C34Weights;
}

export const C34_USE_CASES: UseCase<C34Payload>[] = assertUseCases<C34Payload>([
  {
    id: "c34-pharma-regulated-vendor",
    labId: "C3-4",
    industry: "pharma",
    provenance: studied,
    title: "Regulated research LLM vendor",
    oneLiner: "Security and validation dominate, and concentration risk lurks.",
    context:
      "A pharma company selects an LLM vendor for regulated research. Security, validation, and roadmap dominate; price is almost irrelevant, but standardizing on one hyperscaler creates concentration risk the scorecard doesn't show.",
    theDecision:
      "Weight security and capability heavily and the specialist rises, but pair the pick with its concentration and exit cost before you standardize a validated environment on it.",
    whatMostMiss:
      "Teams optimize the scorecard and ignore that a security first weighting pushes them toward the highest lock in vendor, the risk view is where the real decision is.",
    stakes: "In a validated environment, a forced vendor migration mid study is a compliance and timeline event, not just a cost.",
    takeaway: "In regulated research, weight security, then check what that weighting did to your concentration risk.",
    sources: [
      "Regulated-research LLM vendor selection (validation, security weighting)",
      "Vendor concentration / exit-cost risk",
    ],
    lastVerified: "2026-07-03",
    payload: { weights: { capability: 25, security: 35, roadmap: 15, lockin: 10, support: 10, price: 5 } },
  },
  {
    id: "c34-education-ferpa-vendor",
    labId: "C3-4",
    industry: "education",
    provenance: studied,
    title: "Ed tech vendor under FERPA/COPPA",
    oneLiner: "Student data privacy and portability push the open source pick up.",
    context:
      "A school district selects an AI vendor under FERPA and COPPA. Student data privacy is non negotiable, budgets are tight, and the district is wary of locking children's data into a proprietary platform it can't exit.",
    theDecision:
      "Weight privacy, low lock in, and price and the open source backed option rises to the top, portability and exit cost matter more than the last capability point.",
    whatMostMiss:
      "Districts get sold the flashiest capability, but the binding constraints are data portability and exit cost, a proprietary lock in on children's data is the real risk.",
    stakes: "Locking student data into an un exitable platform is a privacy and political liability, not just a renewal problem.",
    takeaway: "When the constraint is data portability, low lock in outweighs the last capability point.",
    sources: [
      "Ed-tech procurement under FERPA/COPPA (student-data privacy)",
      "Portability / exit-cost weighting",
    ],
    lastVerified: "2026-07-03",
    payload: { weights: { capability: 15, security: 25, roadmap: 10, lockin: 25, support: 10, price: 15 } },
  },
  {
    id: "c34-public-sector-sovereignty",
    labId: "C3-4",
    industry: "public-sector",
    provenance: studied,
    title: "Vendor under data sovereignty rules",
    oneLiner: "Sovereignty and procurement rules become weights, OSS rises.",
    context:
      "A government agency procures an AI vendor under data sovereignty and public procurement rules. Data must stay in country, lock in is politically unacceptable, and the process must defend every criterion.",
    theDecision:
      "Encode sovereignty and low lock in as heavy weights and the open source backed, portable option wins, the constraints are the scorecard.",
    whatMostMiss:
      "Procurement teams treat sovereignty as a checkbox; it's actually a weighting that reshapes the whole ranking away from the hyperscaler default.",
    stakes: "A sovereignty breach or an un exitable contract is an audit and public accountability event.",
    takeaway: "In the public sector, the constraints ARE the weights, encode them and the ranking follows.",
    sources: [
      "Public-sector AI procurement (data sovereignty, anti-lock-in)",
      "Constraint-as-weight vendor scoring",
    ],
    lastVerified: "2026-07-03",
    payload: { weights: { capability: 15, security: 25, roadmap: 10, lockin: 30, support: 15, price: 5 } },
  },
]);
