import { FileText } from "lucide-react";
import { InsightCard } from "@rag/components/common/InsightCard";

export function ExecutiveSummary() {
  return (
    <InsightCard title="Executive Summary" icon={FileText} tone="info">
      <p>
        RAG quality improved from <span className="font-semibold text-ink">64% to 78%</span> across six evaluation runs as the team
        added query rewriting, hybrid search, reranking, citation validation, and compliance guardrails. Retrieval quality now
        exceeds target at 86%, and critical failures fell from five to one.
      </p>
      <p className="mt-2">
        Two issues still block production: <span className="font-semibold text-ink">citation accuracy (82%)</span> remains below the
        85% threshold, and <span className="font-semibold text-ink">P95 latency (4.25s)</span> exceeds the 4-second SLA after reranking.
        One critical compliance query still fails and is held in human review. Current readiness is{" "}
        <span className="font-semibold text-ink">Level 3: Controlled Pilot</span>, with a release recommendation of{" "}
        <span className="font-semibold text-orange-700">Hold</span> until citation and high-risk gaps close.
      </p>
    </InsightCard>
  );
}
