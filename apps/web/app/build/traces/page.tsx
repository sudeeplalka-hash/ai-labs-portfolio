import { PageIntro } from "@rag/components/common/PageIntro";
import { TracesWorkspace } from "@rag/components/traces/TracesWorkspace";

export const metadata = { title: "Query Trace Explorer" };

export default function TracesPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Query Trace Explorer" title="Inspect exactly what happened behind each answer">
        Every trace exposes the rewritten query, retrieved evidence, generated vs expected answer, evaluation scores, and a
        claim-by-claim verification of whether the answer is actually grounded. Switch to Live Lab Traces to inspect the answers you
        generated yourself in the Live RAG Evaluator Lab.
      </PageIntro>
      <TracesWorkspace />
    </div>
  );
}
