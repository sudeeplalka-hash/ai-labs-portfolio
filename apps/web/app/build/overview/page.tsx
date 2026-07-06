import { Activity, ShieldAlert } from "lucide-react";
import { PageIntro } from "@rag/components/common/PageIntro";
import { DataSourceToggle } from "@rag/components/live-views/DataSourceToggle";
import { LiveExecutiveOverview } from "@rag/components/live-views/LiveExecutiveOverview";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { Panel } from "@rag/components/common/Panel";
import { KpiCard } from "@rag/components/dashboard/KpiCard";
import { QualityTrendChart } from "@rag/components/dashboard/QualityTrendChart";
import { RiskBreakdown } from "@rag/components/dashboard/RiskBreakdown";
import { ReadThisDashboard } from "@rag/components/dashboard/ReadThisDashboard";
import { ExecutiveSummary } from "@rag/components/dashboard/ExecutiveSummary";
import { RecommendationPanel } from "@rag/components/dashboard/RecommendationPanel";
import { ReadinessCard } from "@rag/components/dashboard/ReadinessCard";
import { LiveLabActivityCard } from "@rag/components/dashboard/LiveLabActivityCard";
import { LiveLabPromo } from "@rag/components/dashboard/LiveLabPromo";
import { kpis } from "@rag/data/kpis";

function ExecutiveOverviewDemo() {
  return (
    <div className="space-y-6">
            <LiveLabPromo />

      <ReadThisDashboard />

      <div>
        <SectionHeader title="Headline Metrics" description="Current run: compliance-guardrail-v6" icon={Activity} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-3">
          {kpis.map((k) => (
            <KpiCard key={k.id} kpi={k} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader title="Quality Trend Across Runs" description="Overall, retrieval, citation, and faithfulness over six evaluation runs." />
          <QualityTrendChart />
        </Panel>
        <Panel>
          <SectionHeader title="Risk Distribution" description="Evaluated traces by business risk level." icon={ShieldAlert} />
          <RiskBreakdown />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ExecutiveSummary />
          <RecommendationPanel />
        </div>
        <div className="space-y-6">
          <ReadinessCard />
          <LiveLabActivityCard />
        </div>
      </div>
    </div>
  );
}

export const metadata = { title: "Executive Overview" };

export default function ExecutiveOverviewPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Executive Overview" title="Is this RAG system ready for production?">
        A control tower for an enterprise RAG system currently in controlled pilot. Quality is improving, but citation accuracy,
        high risk reliability, and latency still hold the release.
      </PageIntro>
      <DataSourceToggle demo={<ExecutiveOverviewDemo />} live={<LiveExecutiveOverview />} />
    </div>
  );
}
