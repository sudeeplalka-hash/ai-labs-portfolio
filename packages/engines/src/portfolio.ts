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

// Budget-constrained funding — a greedy first cut, not a solved knapsack optimum.
// Rank the positive-value items by value-per-$ of spend (descending) and take them
// in that order while the budget can still fit the next one. `value` is supplied by
// the caller (e.g. riskAdj under the current, possibly user-edited assumptions) so
// the rule the UI shows is exactly the one under test.
export interface FundResult {
  /** ids funded, in the greedy order they were taken. */
  funded: string[];
  /** total spend committed across the funded items. */
  spent: number;
  /** total `value` captured by the funded items. */
  captured: number;
  /** ids not funded — either non-positive value, or positive but didn't fit. */
  cut: string[];
}

export function greedyFund<T extends { id: string; spendM: number }>(
  items: T[],
  budgetM: number,
  value: (i: T) => number,
): FundResult {
  const ranked = items
    .filter((i) => value(i) > 0)
    .slice()
    .sort((a, b) => value(b) / b.spendM - value(a) / a.spendM);
  const funded = new Set<string>();
  let spent = 0;
  for (const i of ranked) {
    if (spent + i.spendM <= budgetM) {
      funded.add(i.id);
      spent += i.spendM;
    }
  }
  const captured = items.filter((i) => funded.has(i.id)).reduce((a, i) => a + value(i), 0);
  return {
    funded: [...funded],
    spent,
    captured,
    cut: items.filter((i) => !funded.has(i.id)).map((i) => i.id),
  };
}
