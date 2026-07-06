export { RealizeView } from "./components/RealizeView";
export * from "./engine/types";
export {
  deriveInputs, applyOverrides, computeRoi, valueRiver, sensitivity, dossier,
} from "./engine/model";
export {
  weightSumOf, readinessComposite, readinessGate, planToReachGate, factorSensitivity, scheduleAdoptionPlan, compareReadiness, readinessTrajectory,
  type ReadinessVerdict, type GateMove, type GatePlan, type FactorLever, type PlanItem, type PlanSpan, type ScheduleOpts, type FactorDelta, type ReadinessComparison, type Trajectory, type TrajectoryPoint,
} from "./engine/adoption";
