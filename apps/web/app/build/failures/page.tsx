import { AlertTriangle, FileWarning, Wrench, Grid3x3 } from "lucide-react";
import { PageIntro } from "@rag/components/common/PageIntro";
import { DataSourceToggle } from "@rag/components/live-views/DataSourceToggle";
import { LiveFailureAnalysis } from "@rag/components/live-views/LiveFailureAnalysis";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { RiskBadge } from "@rag/components/common/Badge";
import { FailureCategoryChart } from "@rag/components/failures/FailureCategoryChart";
import { FailureHeatmap } from "@rag/components/failures/FailureHeatmap";
import { failureCategories, failingDocuments } from "@rag/data/failureAnalysis";

function FailuresDemo() {
  const topRootCauses = [...failureCategories].sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader title="Failures by Category" description="Colored by severity. Citation and stale-source errors dominate." icon={AlertTriangle} />
          <FailureCategoryChart />
        </Panel>
        <Panel>
          <SectionHeader title="Failure Heatmap" description="Failure counts by domain and category." icon={Grid3x3} />
          <FailureHeatmap />
          <div className="mt-4 flex items-center gap-3 text-[11px] text-slatey-500">
            <span>Lower</span>
            <span className="h-3 w-6 rounded bg-amber-500/15" />
            <span className="h-3 w-6 rounded bg-orange-500/25" />
            <span className="h-3 w-6 rounded bg-rose-500/30" />
            <span className="h-3 w-6 rounded bg-rose-500/50" />
            <span>Higher</span>
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionHeader title="Root Cause Insights" description="The three highest-volume failure patterns and how to resolve them." icon={Wrench} />
        <div className="grid gap-4 md:grid-cols-3">
          {topRootCauses.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-navy-850/50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{c.name}</h3>
                <RiskBadge level={c.severity} />
              </div>
              <p className="text-[11px] text-slatey-500">{c.count} failures · {c.percentage}% of total</p>
              <p className="mt-2 text-xs leading-relaxed text-slatey-300">
                <span className="font-medium text-slatey-300">Why: </span>{c.likelyRootCause}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-700/90">
                <span className="font-medium">Fix: </span>{c.recommendedFix}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <SectionHeader title="Top Failing Documents" description="Source documents responsible for the most failures." icon={FileWarning} />
        <table className="data-table min-w-[820px]">
          <thead>
            <tr>
              <th>Document</th>
              <th>Version</th>
              <th>Failed Queries</th>
              <th>Dominant Failure Mode</th>
              <th>Risk</th>
              <th>Recommended Fix</th>
            </tr>
          </thead>
          <tbody>
            {failingDocuments.map((d) => (
              <tr key={d.id}>
                <td className="font-medium text-ink">{d.documentName}</td>
                <td className="whitespace-nowrap text-slatey-400">{d.version}</td>
                <td className="font-semibold text-rose-700">{d.failedQueries}</td>
                <td className="text-slatey-300">{d.dominantFailureMode}</td>
                <td><RiskBadge level={d.riskLevel} /></td>
                <td className="max-w-[280px] text-xs text-slatey-400">{d.recommendedFix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export const metadata = { title: "Failure Analysis" };

export default function FailuresPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Failure Analysis" title="Turn failure patterns into action">
        Sixty-one failures across the latest run, grouped by category, domain, and source document. Each pattern links to a likely
        root cause and a recommended fix so engineering and content teams know exactly what to change.
      </PageIntro>
      <DataSourceToggle demo={<FailuresDemo />} live={<LiveFailureAnalysis />} />
    </div>
  );
}
