import { PageIntro } from "@rag/components/common/PageIntro";
import { GoldenDatasetView } from "@rag/components/dataset/GoldenDatasetView";

export const metadata = { title: "Golden Dataset" };

export default function DatasetPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Golden Dataset" title="The test suite the system is graded against">
        Fifty curated questions spanning HR, finance, compliance, security, legal, IT, and customer service, labeled by difficulty
        and business risk. Critical and high-risk cases carry stricter pass criteria and human review.
      </PageIntro>
      <GoldenDatasetView />
    </div>
  );
}
