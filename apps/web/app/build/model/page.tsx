import { PageIntro } from "@rag/components/common/PageIntro";
import { ModelSelectionView } from "@rag/components/model-selection/ModelSelectionView";

export const metadata = { title: "Model Fit" };

export default function ModelFitPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Model Fit" title="Which LLM should this run on?">
        Before you tune retrieval, choose the engine, it sets your cost per query, latency floor, context budget,
        data-residency story, and how locked-in you are. Weigh the criteria for your initiative and compare candidates
        on the same scale. The pick you make here frames the retrieval work in this lab and flows into AI Ops and Govern.
      </PageIntro>
      <ModelSelectionView />
    </div>
  );
}
