import { PageIntro } from "@rag/components/common/PageIntro";
import { EvaluationsView } from "@rag/components/evaluations/EvaluationsView";

export const metadata = { title: "Evaluation Runs" };

export default function EvaluationsPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Evaluation Runs" title="Compare versions and catch regressions">
        Each run captures a specific model, retriever, reranker, and prompt configuration. Comparing runs shows whether a change
        improved quality or quietly regressed a critical metric.
      </PageIntro>
      <EvaluationsView />
    </div>
  );
}
