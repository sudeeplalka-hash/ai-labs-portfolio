import { PageIntro } from "@data/components/common/PageIntro";
import { CorpusView } from "@data/components/live/CorpusView";

export const metadata = { title: "Corpus Builder" };

export default function Page() {
  return (
    <div>
      <PageIntro eyebrow="Live tool · runs in your browser" title="Corpus Builder">
        Single-file checks can&apos;t see the bigger picture. Load several files and the Corpus Builder maps how they
        relate — surfacing duplicates, stale versions, and conflicting sources — then rolls everything up into a
        corpus-readiness score before any of it reaches the RAG Evaluator.
      </PageIntro>
      <CorpusView />
    </div>
  );
}
