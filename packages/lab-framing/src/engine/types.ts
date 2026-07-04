// ============================================================================
// Strategy & Framing — domain types
// ============================================================================

export type UserKey =
  | "Employees" | "Customers" | "Analysts" | "Frontline staff"
  | "Developers" | "Executives" | "Partners";

export type JobKey =
  | "Answer" | "Summarize" | "Extract" | "Classify"
  | "Decide" | "Monitor" | "Generate" | "Orchestrate";

export type PainKey =
  | "Too slow" | "Inconsistent" | "Too expensive" | "Hard to scale"
  | "Error prone" | "Knowledge trapped" | "Poor experience" | "Impossible today";

export type PostureKey = "Rich & ready" | "Scattered" | "Sparse" | "Unstructured";

export type RiskKey = "Conservative" | "Balanced" | "Aggressive";

export type BucketKey = "Wins" | "Core" | "Differentiators" | "Foundations";

export interface FramingParams {
  user: UserKey;
  job: JobKey;
  pain: PainKey;
  posture: PostureKey;
  risk: RiskKey;
}

export interface TriangleScores {
  value: number;        // 0..100
  feasibility: number;  // 0..100
  dataReadiness: number;// 0..100
}

export interface UseCase {
  id: number;
  bucket: BucketKey;
  title: string;
  desc: string;
  value: number;  // 0..100
  effort: number; // 0..100
}

export type MetricShape =
  | "Reduce time" | "Increase rate" | "Cut cost" | "% within threshold";

export interface SuccessMetric {
  shape: MetricShape;
  baseline: string;
  target: string;
  coverage: string;
}

export type VerdictTone = "healthy" | "watch" | "risk" | "info";

export interface Verdict {
  tone: VerdictTone;
  headline: string;
  detail: string;
  humanReview: boolean;
}

export type StageKey = "frame" | "data" | "build" | "deploy" | "govern" | "realize";
export type StageStatus = "locked" | "active" | "done";

export interface ProgramState {
  initiative: {
    name: string | null;
    rawAmbition: string;
    sharpenedProblem: string | null;
    params: FramingParams | null;
    selectedUseCase: UseCase | null;
    scope: number; // 0..1
    successMetric: SuccessMetric | null;
    scores: TriangleScores;
    valueHypothesis: string | null;
    createdAt: string | null;
  };
  progress: Record<StageKey, StageStatus>;
}

export interface PortfolioEntry {
  id: string;
  name: string;
  scores: TriangleScores;
  bucket: BucketKey;
  scope: number;
  createdAt: string;
}
