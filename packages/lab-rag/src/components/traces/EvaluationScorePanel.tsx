import { ScoreBar } from "@rag/components/common/ScoreBar";
import type { TraceScores } from "@rag/types";

const HIGHER = [
  { key: "contextRelevance", label: "Context Relevance", target: 85 },
  { key: "retrievalCompleteness", label: "Retrieval Completeness", target: 82 },
  { key: "faithfulness", label: "Faithfulness", target: 85 },
  { key: "completeness", label: "Completeness", target: 83 },
  { key: "citationAccuracy", label: "Citation Accuracy", target: 85 },
  { key: "claimSupport", label: "Claim Support", target: 85 },
] as const;

const RISK = [
  { key: "hallucinationRisk", label: "Hallucination Risk", target: 8 },
  { key: "piiRisk", label: "PII Risk", target: 5 },
  { key: "complianceRisk", label: "Compliance Risk", target: 20 },
] as const;

export function EvaluationScorePanel({ scores }: { scores: TraceScores }) {
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {HIGHER.map((m) => (
        <div key={m.key}>
          <div className="mb-1 text-xs text-slatey-300">{m.label}</div>
          <ScoreBar value={scores[m.key]} target={m.target} />
        </div>
      ))}
      {RISK.map((m) => (
        <div key={m.key}>
          <div className="mb-1 text-xs text-slatey-300">{m.label}</div>
          <ScoreBar value={scores[m.key]} target={m.target} mode="lower-better" />
        </div>
      ))}
    </div>
  );
}
