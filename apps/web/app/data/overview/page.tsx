import { PageIntro } from "@data/components/common/PageIntro";
import { ExecutiveDashboard } from "@data/components/dashboard/ExecutiveDashboard";

export const metadata = { title: "Executive Overview" };

export default function Page() {
  return (
    <div>
      <PageIntro eyebrow="Dashboard · demo or your sessions" title="Executive Overview">
        The cost and throughput of getting data ingestion-ready. Toggle between the demo program and a view recomputed
        from the files you&apos;ve actually run through the Live Data Lab and Corpus Builder.
      </PageIntro>
      <ExecutiveDashboard />
    </div>
  );
}
