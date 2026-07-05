export { RealizeView } from "./components/RealizeView";
export * from "./engine/types";
export {
  deriveInputs, applyOverrides, computeRoi, valueRiver, sensitivity, dossier,
} from "./engine/model";
export {
  weightSumOf, readinessComposite, readinessGate, planToReachGate, factorSensitivity,
  type ReadinessVerdict, type GateMove, type GatePlan, type FactorLever,
} from "./engine/adoption";
