// @labs/kit · use cases, aggregation + computed coverage.
// Each lab's use cases live in their own file (typed payload). This index rolls
// them up and computes coverage from the data (the Atlas reads USE_CASE_COVERAGE;
// nothing is asserted). Extend USE_CASES_BY_LAB as labs are added.

import { type UseCase, coverageFrom } from "../industries";
import { GAP01_USE_CASES } from "./gap01";
import { GAP02_USE_CASES } from "./gap02";
import { GAP03_USE_CASES } from "./gap03";
import { GAP04_USE_CASES } from "./gap04";
import { GAP05_USE_CASES } from "./gap05";
import { GAP06_USE_CASES } from "./gap06";
import { GAP07_USE_CASES } from "./gap07";
import { GAP08_USE_CASES } from "./gap08";
import { C31_USE_CASES } from "./c3-1";
import { C32_USE_CASES } from "./c3-2";
import { C33_USE_CASES } from "./c3-3";
import { C34_USE_CASES } from "./c3-4";
import { C35_USE_CASES } from "./c3-5";
import { EL01_USE_CASES } from "./el01";
import { EL02_USE_CASES } from "./el02";
import { EL03_USE_CASES } from "./el03";
import { EL04_USE_CASES } from "./el04";
import { EL05_USE_CASES } from "./el05";
import { EL06_USE_CASES } from "./el06";
import { EL07_USE_CASES } from "./el07";
import { EL08_USE_CASES } from "./el08";
import { EL09_USE_CASES } from "./el09";
import { EL10_USE_CASES } from "./el10";

export * from "./gap01";
export * from "./gap02";
export * from "./gap03";
export * from "./gap04";
export * from "./gap05";
export * from "./gap06";
export * from "./gap07";
export * from "./gap08";
export * from "./c3-1";
export * from "./c3-2";
export * from "./c3-3";
export * from "./c3-4";
export * from "./c3-5";
export * from "./el01";
export * from "./el02";
export * from "./el03";
export * from "./el04";
export * from "./el05";
export * from "./el06";
export * from "./el07";
export * from "./el08";
export * from "./el09";
export * from "./el10";

export const USE_CASES_BY_LAB: Record<string, UseCase[]> = {
  "GAP-01": GAP01_USE_CASES,
  "GAP-02": GAP02_USE_CASES,
  "GAP-03": GAP03_USE_CASES,
  "GAP-04": GAP04_USE_CASES,
  "GAP-05": GAP05_USE_CASES,
  "GAP-06": GAP06_USE_CASES,
  "GAP-07": GAP07_USE_CASES,
  "GAP-08": GAP08_USE_CASES,
  "C3-1": C31_USE_CASES,
  "C3-2": C32_USE_CASES,
  "C3-3": C33_USE_CASES,
  "C3-4": C34_USE_CASES,
  "C3-5": C35_USE_CASES,
  "EL-01": EL01_USE_CASES,
  "EL-02": EL02_USE_CASES,
  "EL-03": EL03_USE_CASES,
  "EL-04": EL04_USE_CASES,
  "EL-05": EL05_USE_CASES,
  "EL-06": EL06_USE_CASES,
  "EL-07": EL07_USE_CASES,
  "EL-08": EL08_USE_CASES,
  "EL-09": EL09_USE_CASES,
  "EL-10": EL10_USE_CASES,
};

export const ALL_USE_CASES: UseCase[] = Object.values(USE_CASES_BY_LAB).flat();

export function useCasesForLab(labId: string): UseCase[] {
  return USE_CASES_BY_LAB[labId] ?? [];
}

// Coverage computed from the registry, the honest headline the Atlas renders.
export const USE_CASE_COVERAGE = coverageFrom(ALL_USE_CASES);
