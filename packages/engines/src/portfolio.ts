// AI-initiative portfolio engine (C3-1 · Portfolio Dashboard).
// Risk-adjusted value = expected value × P(success by stage) − spend, and an
// explicit kill / scale / hold call. Capital allocation with a visible rule.

export type Stage = "discovery" | "pilot" | "scaling" | "production";
export type Rec = "kill" | "hold" | "scale";

export interface Initiative {
  id: string;
  name: string;
  domain: string;
  stage: Stage;
  expValueM: number;
  spendM: number;
  risk: number;   // 0..1
  planVar: number;
}

// Stage-based probability of success — industry-informed defaults.
export const STAGE_PROB: Record<Stage, number> = {
  discovery: 0.15,
  pilot: 0.30,
  scaling: 0.60,
  production: 0.85,
};

export const prob = (i: Initiative): number => STAGE_PROB[i.stage];

export const riskAdj = (i: Initiative): number => i.expValueM * prob(i) - i.spendM; // $M/yr

export function recommend(i: Initiative): Rec {
  const r = riskAdj(i);
  if (r < 0) return "kill";
  if ((i.stage === "scaling" || i.stage === "production") && r >= 1.5 * i.spendM && i.risk < 0.6) return "scale";
  return "hold";
}
