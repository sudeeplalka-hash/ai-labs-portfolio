// EL-06 · Talent & Upskilling Pathway Planner — use-cases.
// Payload = a different org's capability map (current vs agentic-era target per
// capability) plus how fast that org's stack moved and a label for it. The gap
// heatmap, the build/hire/partner pathways, and the stack-vs-team timeline all
// recompute from it.

import { type UseCase, assertUseCases, firstHand, studied } from "../industries";

export interface El06Cap { key: string; label: string; current: number; target: number }
export interface El06Payload {
  caps: El06Cap[];
  stackMonths: number;
  stackLabel: string; // timeline label for the stack shift
}

export const EL06_USE_CASES: UseCase<El06Payload>[] = assertUseCases<El06Payload>([
  {
    id: "el06-bank-ai-coe",
    labId: "EL-06",
    industry: "financial-services",
    provenance: firstHand,
    title: "Bank AI Center of Excellence upskilling",
    oneLiner: "Governance and model-risk carry the highest targets — and can't be partnered out.",
    context:
      "A bank's AI CoE re-skilling for the agentic era. The capability targets skew to governance and model-risk validation — the highest bars in a regulated shop — where the fast lever (partner) doesn't work because the accountability can't be rented.",
    theDecision:
      "Build where it's regulated, partner where it's not: model-risk and AI governance must be built or hired because the bank owns the accountability, so reserve partnering for orchestration and eval where speed is safe.",
    whatMostMiss:
      "Teams pick the pathway by cost and speed and forget that in a bank some capabilities legally can't be outsourced — governance has to be in-house, which changes the whole build/hire/partner mix.",
    stakes: "Partner your governance capability and you've rented the one thing examiners hold you personally accountable for.",
    takeaway: "In a bank CoE, governance and model-risk must be built or hired — you can't partner accountability.",
    sources: [
      "Bank AI CoE capability building (first-hand, financial services)",
      "Regulated-org build/hire/partner constraints",
    ],
    lastVerified: "2026-07-03",
    payload: {
      stackMonths: 15,
      stackLabel: "Bank AI stack shifted",
      caps: [
        { key: "prompt", label: "Prompt & context engineering", current: 50, target: 80 },
        { key: "orch", label: "Agent orchestration (MCP / A2A)", current: 25, target: 70 },
        { key: "eval", label: "Eval & observability for LLMs", current: 40, target: 85 },
        { key: "risk", label: "Model-risk & validation", current: 55, target: 90 },
        { key: "gov", label: "AI governance & controls", current: 50, target: 90 },
        { key: "domain", label: "Domain × AI translation", current: 70, target: 85 },
      ],
    },
  },
  {
    id: "el06-manufacturer-plant-floor",
    labId: "EL-06",
    industry: "manufacturing",
    provenance: studied,
    title: "Plant-floor AI capability build",
    oneLiner: "The gap isn't ML — it's the OT/IT and edge skills that make ML run on the floor.",
    context:
      "A manufacturer building AI capability for the plant floor. The visible gap is ML, but the binding gaps are industrial data engineering (OT/IT convergence), edge MLOps, and OT security — the skills that get a model off the laptop and onto the line safely.",
    theDecision:
      "Staff the deployment skills, not the modeling skills: OT/IT data engineering, edge MLOps, and OT security are the plant-floor bottleneck, and floor knowledge must be built because it can't be hired off the shelf.",
    whatMostMiss:
      "Teams over-index on data science and under-index on the OT/edge/security skills that decide whether AI survives contact with the plant. On the floor, deployment capability is the scarce one.",
    stakes: "Skip the OT and edge skills and every model works in the lab and dies on the line.",
    takeaway: "In manufacturing, the scarce AI skill is OT/edge deployment — not modeling. Build the floor skills.",
    sources: [
      "Manufacturing / plant-floor AI capability (studied)",
      "OT/IT convergence and edge-MLOps skill gaps",
    ],
    lastVerified: "2026-07-03",
    payload: {
      stackMonths: 20,
      stackLabel: "Industry-4.0 stack shifted",
      caps: [
        { key: "otdata", label: "Industrial data eng (OT/IT)", current: 45, target: 82 },
        { key: "mlvision", label: "ML for vision & predictive", current: 40, target: 78 },
        { key: "edge", label: "Edge / on-floor MLOps", current: 30, target: 78 },
        { key: "otsec", label: "OT security", current: 50, target: 85 },
        { key: "domain", label: "Process × AI translation", current: 65, target: 85 },
        { key: "change", label: "Floor change management", current: 55, target: 80 },
      ],
    },
  },
  {
    id: "el06-creative-agency-genai",
    labId: "EL-06",
    industry: "marketing",
    provenance: studied,
    title: "Creative agency genAI upskilling",
    oneLiner: "Tooling moves in a year; the sleeper gap is rights, IP, and disclosure.",
    context:
      "A creative and marketing agency re-skilling for generative AI. The tooling shifts fastest of any industry here, but the widest and most dangerous gap isn't craft — it's rights/IP hygiene and AI-disclosure, the capability that keeps client work defensible.",
    theDecision:
      "Hire for taste, partner for pipeline, but build the rights/IP capability: the IP-and-disclosure gap is the one that turns a delivered campaign into a legal liability, so it can't be rented.",
    whatMostMiss:
      "Agencies chase the newest tool and treat rights/IP as legal's problem. In genAI creative, provenance and disclosure are a delivery capability — the sleeper risk that scales with output.",
    stakes: "Ignore the rights/IP gap and the faster you produce, the faster you ship indefensible work.",
    takeaway: "In creative agencies, rights/IP and disclosure is the sleeper capability gap — build it or ship liability.",
    sources: [
      "Creative / marketing agency genAI adoption (studied)",
      "AI content provenance, rights, and disclosure practice",
    ],
    lastVerified: "2026-07-03",
    payload: {
      stackMonths: 12,
      stackLabel: "Creative AI tooling shifted",
      caps: [
        { key: "direct", label: "AI creative direction", current: 60, target: 88 },
        { key: "brandsafe", label: "Brand-safe genAI workflows", current: 40, target: 85 },
        { key: "contentops", label: "AI content ops / pipeline", current: 35, target: 80 },
        { key: "measure", label: "Measurement & attribution", current: 45, target: 80 },
        { key: "rights", label: "Rights / IP & disclosure", current: 30, target: 85 },
        { key: "advisory", label: "Client × AI advisory", current: 55, target: 80 },
      ],
    },
  },
]);
