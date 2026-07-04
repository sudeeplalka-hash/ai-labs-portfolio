// @labs/kit · use-cases — aggregation + computed coverage.
// Each lab's use-cases live in their own file (typed payload). This index rolls
// them up and computes coverage from the data (the Atlas reads USE_CASE_COVERAGE;
// nothing is asserted). Extend USE_CASES_BY_LAB as labs are added in Phases B/C.

import { type UseCase, coverageFrom } from "../industries";
import { GAP03_USE_CASES } from "./gap03";
import { C31_USE_CASES } from "./c3-1";
import { EL01_USE_CASES } from "./el01";

export * from "./gap03";
export * from "./c3-1";
export * from "./el01";

export const USE_CASES_BY_LAB: Record<string, UseCase[]> = {
  "GAP-03": GAP03_USE_CASES,
  "C3-1": C31_USE_CASES,
  "EL-01": EL01_USE_CASES,
};

export const ALL_USE_CASES: UseCase[] = Object.values(USE_CASES_BY_LAB).flat();

export function useCasesForLab(labId: string): UseCase[] {
  return USE_CASES_BY_LAB[labId] ?? [];
}

// Coverage computed from the registry — the honest headline the Atlas renders.
export const USE_CASE_COVERAGE = coverageFrom(ALL_USE_CASES);
