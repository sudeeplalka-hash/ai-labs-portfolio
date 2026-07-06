// EL-03 · Capacity & Resourcing Planner, use cases.
// Payload = a different program's skill inventory (demand vs capacity per skill)
// plus its base delivery window, base run-rate, and team size. The heatmap, the
// hire/contract/upskill toggles, and the date/cost math all recompute from it.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface El03Skill { key: string; label: string; capacity: number; demand: number }
export interface El03Payload {
  skills: El03Skill[];
  baseWeeks: number;
  baseMonthly: number; // $k, base team run-rate
  teamLabel: string;
}

export const EL03_USE_CASES: UseCase<El03Payload>[] = assertUseCases<El03Payload>([
  {
    id: "el03-consulting-delivery-pod",
    labId: "EL-03",
    industry: "consulting",
    provenance: firstHand,
    title: "Global-SI delivery pod across engagements",
    oneLiner: "48 people staffed across five client engagements, short in exactly one skill that gates all of them.",
    context:
      "A global systems-integrator delivery pod staffing several concurrent client AI engagements. Headcount looks fine; the pod is short in GenAI engineering specifically, and that one skill sits on the critical path of every engagement.",
    theDecision:
      "Staff the skill, not the headcount: the pod isn't short of people, it's short of GenAI engineers, and contract-to-bridge beats hire-to-plan when the client date is fixed.",
    whatMostMiss:
      "SI staffing plans balance total FTE across engagements and miss that one scarce skill is the shared bottleneck. Fungibility is the myth, an architect can't close a GenAI-engineering gap.",
    stakes: "Balance on headcount and every engagement slips together when the one scarce skill runs out.",
    takeaway: "In SI delivery, one scarce skill on every critical path gates the whole book, staff that, not the total.",
    sources: [
      "Global-SI multi-engagement resourcing (firsthand, consulting delivery)",
      "Skills-based capacity planning practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      teamLabel: "48 FTE",
      baseWeeks: 24,
      baseMonthly: 720,
      skills: [
        { key: "arch", label: "Solution Architecture", capacity: 8, demand: 7 },
        { key: "genai", label: "GenAI Engineering", capacity: 7, demand: 12 },
        { key: "data", label: "Data Engineering", capacity: 8, demand: 10 },
        { key: "dm", label: "Delivery Management", capacity: 7, demand: 6 },
        { key: "sme", label: "Client SME", capacity: 9, demand: 6 },
        { key: "qa", label: "QA / Eval", capacity: 6, demand: 8 },
      ],
    },
  },
  {
    id: "el03-hrtech-feature-team",
    labId: "EL-03",
    industry: "hr",
    provenance: studied,
    title: "HR-tech AI feature team",
    oneLiner: "The scarce skill isn't engineering, it's the fairness scientist who keeps the feature legal.",
    context:
      "An HR-tech company building AI screening and skills-inference features. The engineering gaps are the obvious read, but the true bottleneck is the I/O-psychology / fairness-validation skill, without it, features can't ship into a regulated hiring context.",
    theDecision:
      "The bottleneck is a compliance skill, not a build skill: the fairness-validation gap gates every release, so upskill-and-hire there before adding more engineers who'll just queue behind it.",
    whatMostMiss:
      "Teams staff for velocity and treat validation as a checkpoint, then stall at launch. In regulated HR AI, the fairness/validation skill is on the critical path, not beside it.",
    stakes: "Add engineers without the fairness skill and you build faster into a release gate you still can't clear.",
    takeaway: "In HR-tech AI, the fairness-validation skill is the real bottleneck, everything else queues behind it.",
    sources: [
      "HR-tech AI feature staffing (studied)",
      "Adverse-impact / fairness validation as a delivery constraint",
    ],
    lastVerified: "2026-07-03",
    payload: {
      teamLabel: "22 FTE",
      baseWeeks: 18,
      baseMonthly: 330,
      skills: [
        { key: "ml", label: "Applied ML", capacity: 6, demand: 8 },
        { key: "data", label: "Data Engineering", capacity: 5, demand: 6 },
        { key: "plat", label: "ML Platform", capacity: 4, demand: 4 },
        { key: "prod", label: "Product / Delivery", capacity: 5, demand: 3 },
        { key: "fair", label: "Fairness / I-O Science", capacity: 2, demand: 6 },
        { key: "qa", label: "QA / Eval", capacity: 4, demand: 5 },
      ],
    },
  },
  {
    id: "el03-bank-ai-coe",
    labId: "EL-03",
    industry: "financial-services",
    provenance: firstHand,
    title: "Bank AI Center of Excellence",
    oneLiner: "In a regulated shop the platform and model-risk skills gate everything, and both are short.",
    context:
      "A bank's AI Center of Excellence staffing enterprise demand across lines of business. Two regulated-environment skills, MLOps/platform and model-risk validation, are the real constraints; demand for both outruns a nominally well-staffed team.",
    theDecision:
      "Two regulated bottlenecks, not general capacity: MLOps/platform and model-risk validation gate every deployment in a bank, so resolve those before ML-engineering, which is close to balanced.",
    whatMostMiss:
      "CoEs staff for model-building and under-resource the platform and validation functions that let a model actually go live under supervision. In banks the constraint is downstream of the model.",
    stakes: "Under-staff platform and model-risk and models pile up in a validation queue no headcount elsewhere can clear.",
    takeaway: "In a bank CoE, platform and model-risk validation are the gates, general ML capacity isn't the constraint.",
    sources: [
      "Bank AI CoE resourcing (firsthand, financial services)",
      "Model-risk validation and MLOps as regulated bottlenecks",
    ],
    lastVerified: "2026-07-03",
    payload: {
      teamLabel: "36 FTE",
      baseWeeks: 26,
      baseMonthly: 612,
      skills: [
        { key: "ml", label: "ML Engineering", capacity: 8, demand: 9 },
        { key: "data", label: "Data Engineering", capacity: 7, demand: 8 },
        { key: "mlops", label: "MLOps / Platform", capacity: 5, demand: 9 },
        { key: "risk", label: "Model-Risk Validation", capacity: 3, demand: 7 },
        { key: "delivery", label: "Delivery / PM", capacity: 6, demand: 5 },
        { key: "sme", label: "Domain SME", capacity: 7, demand: 5 },
      ],
    },
  },
]);
