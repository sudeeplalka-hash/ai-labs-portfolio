export { StrategyPlanningView } from "./components/strategy/StrategyPlanningView";
// engine is exported too, so other labs/tests can reuse the deterministic logic
export * from "./engine/types";
export { scoreTriangle, SCORE_TARGETS } from "./engine/scoring";
export { generateBacklog } from "./engine/backlog";
export { deriveVerdict, deriveInsights } from "./engine/verdict";
