// ============================================================================
// Realize / Business Outcome, domain types. Every figure carries its source
// stage (the traceability spine) so the ROI is defensible, not asserted.
// ============================================================================
import type { StageKey } from "@labs/program-core";

export interface Traced<T> { value: T; source: StageKey; basis: string }

export interface RealizeInputs {
  annualTasks: Traced<number>;
  minutesSavedPerTask: Traced<number>;
  laborRatePerHour: number;
  adoption: Traced<number>;      // 0..1
  quality: Traced<number>;       // 0..1 (answer faithfulness → trust → use)
  annualRunCost: Traced<number>;
  riskDiscount: Traced<number>;  // 0..1
  investment: number;            // one-time build/deploy cost
}

export type OverrideKey = "minutesSavedPerTask" | "adoption" | "quality" | "laborRatePerHour" | "investment";

export interface RoiResult {
  addressable: number;
  adoptionLoss: number;
  qualityLoss: number;
  realized: number;
  runCost: number;
  riskDiscountAmt: number;
  grossValue: number;
  riskAdjustedValue: number;
  roiPct: number;
  paybackMonths: number;
  npv3yr: number;
}

export interface RiverFlow {
  key: string;
  label: string;
  amount: number;
  kind: "in" | "leak" | "out";
  source: StageKey;
}

export interface SensitivityBar { key: OverrideKey; label: string; low: number; high: number; swing: number }

export interface DossierRow { stage: StageKey; label: string; metric: string; value: string; basis: string }
