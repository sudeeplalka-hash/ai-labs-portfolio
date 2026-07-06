import { CircleCheckBig, ShieldAlert, Wrench } from "lucide-react";
import { PageIntro } from "@rag/components/common/PageIntro";
import { DataSourceToggle } from "@rag/components/live-views/DataSourceToggle";
import { LiveQualityGates } from "@rag/components/live-views/LiveQualityGates";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { GateBadge, RiskBadge, ReleaseBadge } from "@rag/components/common/Badge";
import { InsightCard } from "@rag/components/common/InsightCard";
import { qualityGates } from "@rag/data/qualityGates";
import { getReleaseRecommendation, summarizeGates } from "@rag/lib/scoring";
import { cn } from "@rag/lib/cn";

function QualityGatesDemo() {
  const summary = summarizeGates(qualityGates);
  const recommendation = getReleaseRecommendation(qualityGates);
  const failedOrWarning = qualityGates.filter((g) => g.status === "Failed" || g.status === "Warning");

  const counts = [
    { label: "Passed", value: summary.Passed, color: "text-emerald-700" },
    { label: "Warning", value: summary.Warning, color: "text-amber-700" },
    { label: "Failed", value: summary.Failed, color: "text-rose-700" },
    { label: "Not Evaluated", value: summary["Not Evaluated"], color: "text-slatey-400" },
  ];

  return (
    <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-1">
          <SectionHeader title="Release Decision" icon={CircleCheckBig} />
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/[0.07] p-4 text-center">
            <p className="stat-label">Current Recommendation</p>
            <div className="mt-2 flex justify-center">
              <ReleaseBadge recommendation={recommendation} className="px-3 py-1 text-sm" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {counts.map((c) => (
              <div key={c.label} className="rounded-lg border border-slate-100 bg-navy-850/50 p-3 text-center">
                <p className={cn("text-2xl font-semibold", c.color)}>{c.value}</p>
                <p className="text-[11px] text-slatey-500">{c.label}</p>
              </div>
            ))}
          </div>
        </Panel>

        <InsightCard title="Why Hold?" icon={ShieldAlert} tone="warn" className="lg:col-span-2">
          <p>
            Citation accuracy (82%) sits below the 85% production threshold, a High severity gate failure, so the documented decision
            logic returns <span className="font-semibold text-ink">Hold</span> rather than promotion. High risk query pass rate (87%)
            and P95 latency (4.25s) are on warning, and one critical compliance query remains in human review.
          </p>
          <p className="mt-2">
            The system should not be promoted until the citation overlap check ships and the open critical failure is resolved. Cost,
            regression tolerance, and human-review completion all pass, so a focused fix on citations and latency would move this to
            <span className="font-semibold text-ink"> Promote with Monitoring</span>.
          </p>
        </InsightCard>
      </div>

      <Panel className="overflow-x-auto">
        <SectionHeader title="Quality Gate Status" description="Eight gates spanning quality, risk, latency, cost, regression, and governance." />
        <table className="data-table min-w-[900px]">
          <thead>
            <tr>
              <th>Gate</th>
              <th>Threshold</th>
              <th>Current</th>
              <th>Status</th>
              <th>Severity</th>
              <th>Remediation</th>
            </tr>
          </thead>
          <tbody>
            {qualityGates.map((g) => (
              <tr key={g.id}>
                <td>
                  <span className="font-medium text-ink">{g.name}</span>
                  <span className="mt-0.5 block text-[11px] text-slatey-500">{g.description}</span>
                </td>
                <td className="whitespace-nowrap font-mono text-xs text-slatey-300">{g.threshold}</td>
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-ink">{g.currentValue}</td>
                <td><GateBadge status={g.status} /></td>
                <td><RiskBadge level={g.severity} /></td>
                <td className="max-w-[300px] text-xs text-slatey-400">{g.remediation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel>
        <SectionHeader title="Remediation Plan" description="What must change to clear the open gates before promotion." icon={Wrench} />
        <div className="grid gap-3 md:grid-cols-2">
          {failedOrWarning.map((g) => (
            <div key={g.id} className="rounded-lg border border-line bg-navy-850/50 p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{g.name}</h3>
                <GateBadge status={g.status} />
              </div>
              <p className="text-[11px] text-slatey-500">Target {g.threshold} · currently {g.currentValue}</p>
              <p className="mt-2 text-xs leading-relaxed text-slatey-300">{g.remediation}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export const metadata = { title: "Quality Gates" };

export default function QualityGatesPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Quality Gates" title="Should this release be promoted?">
        Quality gates turn evaluation from passive reporting into release control. A version is only promoted when it clears the
        quality, risk, latency, cost, and governance thresholds, not because a demo looked good.
      </PageIntro>
      <DataSourceToggle demo={<QualityGatesDemo />} live={<LiveQualityGates />} />
    </div>
  );
}
