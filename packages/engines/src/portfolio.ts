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

// Redeploy-the-kills — cut the negative-value initiatives and reallocate their freed
// capital into the Scale column. Two honest parts: (1) the *cut* is pure accounting —
// removing negative risk-adjusted value raises the portfolio total by exactly that
// drag, guaranteed; (2) the *redeploy* is illustrative — freed capital is offered to
// scale targets greedily by risk-adjusted return-per-$, each capped at `topUpMultiple`
// × its current spend, and credited at that initiative's *current* return-per-$ (a
// visible ratio, not an invented scaling curve). `value` and `isScaleTarget` are
// supplied by the caller so the assumptions the UI shows are the ones computed here.
export interface ReallocTarget {
  id: string;
  allocatedM: number;
  addedValueM: number; // illustrative, at current return-per-$
}
export interface ReallocationResult {
  killed: string[];
  freedCapitalM: number;
  dragRemovedM: number;            // positive: the negative value removed by cutting
  targets: ReallocTarget[];
  redeployedM: number;             // capital actually absorbed by caps (<= freed)
  redeployedValueM: number;        // illustrative added value
  reserveM: number;                // freed capital left unallocated after caps
  baseRiskAdjM: number;            // portfolio risk-adjusted value, before
  afterCutRiskAdjM: number;        // after cutting the kills (real)
  afterRedeployRiskAdjM: number;   // after cut + illustrative redeploy
}

export function reallocateKills<T extends { id: string; spendM: number }>(
  items: T[],
  value: (i: T) => number,
  isScaleTarget: (i: T) => boolean,
  topUpMultiple = 1,
): ReallocationResult {
  const killed = items.filter((i) => value(i) < 0);
  const killedValue = killed.reduce((a, i) => a + value(i), 0); // negative
  const freedCapitalM = killed.reduce((a, i) => a + i.spendM, 0);
  const baseRiskAdjM = items.reduce((a, i) => a + value(i), 0);
  const afterCutRiskAdjM = baseRiskAdjM - killedValue;

  const ranked = items
    .filter((i) => isScaleTarget(i) && value(i) > 0 && i.spendM > 0)
    .slice()
    .sort((a, b) => value(b) / b.spendM - value(a) / a.spendM);
  let remaining = freedCapitalM;
  const targets: ReallocTarget[] = [];
  for (const i of ranked) {
    if (remaining <= 1e-9) break;
    const cap = topUpMultiple * i.spendM;
    const alloc = Math.min(cap, remaining);
    if (alloc <= 0) continue;
    targets.push({ id: i.id, allocatedM: alloc, addedValueM: alloc * (value(i) / i.spendM) });
    remaining -= alloc;
  }
  const redeployedValueM = targets.reduce((a, t) => a + t.addedValueM, 0);
  return {
    killed: killed.map((i) => i.id),
    freedCapitalM,
    dragRemovedM: -killedValue,
    targets,
    redeployedM: freedCapitalM - remaining,
    redeployedValueM,
    reserveM: remaining,
    baseRiskAdjM,
    afterCutRiskAdjM,
    afterRedeployRiskAdjM: afterCutRiskAdjM + redeployedValueM,
  };
}

// Bring-your-own-book CSV import. Maps rows (keyed by header) to initiatives: lenient
// on header names, coerces numbers (tolerating $, %, commas, trailing "M"), clamps
// risk to 0..1, and skips rows missing a name / valid stage / value / positive spend.
// Pure — the parsing of the CSV text itself lives in the design system.
const CSV_STAGES: Stage[] = ["discovery", "pilot", "scaling", "production"];
export interface CsvImportResult {
  items: Initiative[];
  skipped: number;
}
export function initiativesFromCsvRows(rows: Record<string, string>[]): CsvImportResult {
  const toNum = (v: string | undefined): number => {
    const s = String(v ?? "").replace(/[$,%\s]/g, "").replace(/m$/i, "").trim();
    return s === "" ? NaN : Number(s);
  };
  const get = (row: Record<string, string>, aliases: string[]): string | undefined => {
    for (const key of Object.keys(row)) {
      if (aliases.includes(key.toLowerCase().trim())) return row[key];
    }
    return undefined;
  };
  const items: Initiative[] = [];
  let skipped = 0;
  rows.forEach((row, i) => {
    const name = (get(row, ["name", "initiative"]) ?? "").trim();
    const stage = ((get(row, ["stage"]) ?? "").toLowerCase().trim()) as Stage;
    const expValueM = toNum(get(row, ["expvaluem", "expected value", "expected value ($m)", "value"]));
    const spendM = toNum(get(row, ["spendm", "spend", "spend ($m)"]));
    if (!name || !CSV_STAGES.includes(stage) || !Number.isFinite(expValueM) || !Number.isFinite(spendM) || spendM <= 0) {
      skipped++;
      return;
    }
    const risk = toNum(get(row, ["risk"]));
    const planVar = toNum(get(row, ["planvar", "plan var", "plan variance"]));
    items.push({
      id: `csv-${i}`,
      name,
      domain: (get(row, ["domain"]) ?? "Custom").trim() || "Custom",
      stage,
      expValueM,
      spendM,
      risk: Number.isFinite(risk) ? Math.max(0, Math.min(1, risk)) : 0.5,
      planVar: Number.isFinite(planVar) ? planVar : 0,
    });
  });
  return { items, skipped };
}
