"use client";

import { useMemo } from "react";
import { CircleCheckBig } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { GateBadge, RiskBadge, ReleaseBadge } from "@rag/components/common/Badge";
import { InsightCard } from "@rag/components/common/InsightCard";
import { useLiveTraces } from "./useLiveTraces";
import { LiveEmptyState } from "./LiveEmptyState";
import { getReleaseRecommendation, summarizeGates } from "@rag/lib/scoring";
import { cn } from "@rag/lib/cn";
import type { QualityGate, GateStatus, RiskLevel } from "@rag/types";

const avg = (ns: number[]) => (ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0);

export function LiveQualityGates() {
  const { mounted, traces } = useLiveTraces();
  const gates = useMemo<QualityGate[]>(() => {
    const e = traces.map((t) => t.evaluation);
    const overall = avg(e.map((x) => x.overallQuality));
    const cite = avg(e.map((x) => x.citationAccuracy));
    const halluc = avg(e.map((x) => x.hallucinationRisk));
    const faith = avg(e.map((x) => x.faithfulness));
    const review = e.filter((x) => x.humanReviewRequired).length;

    const hi = (ok: boolean, near: boolean): GateStatus => (ok ? "Passed" : near ? "Warning" : "Failed");
    return [
      { id: "g-overall", name: "Overall Quality", description: "Composite quality across your questions.", threshold: ">= 80%", currentValue: `${overall}%`, status: hi(overall >= 80, overall >= 70), severity: "High" as RiskLevel, remediation: "Improve retrieval coverage and grounding on weak questions." },
      { id: "g-cite", name: "Citation Accuracy", description: "Citations directly support the claims.", threshold: ">= 80%", currentValue: `${cite}%`, status: hi(cite >= 80, cite >= 70), severity: "High" as RiskLevel, remediation: "Ask more specific questions; rely on cited passages." },
      { id: "g-halluc", name: "Hallucination Risk", description: "Unsupported content in answers.", threshold: "<= 20%", currentValue: `${halluc}%`, status: hi(halluc <= 20, halluc <= 35), severity: "Critical" as RiskLevel, remediation: "Low coverage drives this, try documents that cover the topic." },
      { id: "g-faith", name: "Faithfulness", description: "Answers grounded in retrieved evidence.", threshold: ">= 70%", currentValue: `${faith}%`, status: hi(faith >= 70, faith >= 60), severity: "High" as RiskLevel, remediation: "Prefer questions the document directly answers." },
      { id: "g-review", name: "Human Review", description: "Answers flagged for human review.", threshold: "= 0", currentValue: String(review), status: hi(review === 0, review <= 1), severity: "Critical" as RiskLevel, remediation: "High risk or weakly grounded answers were escalated." },
    ];
  }, [traces]);

  if (!mounted) return <div className="h-40 animate-pulse rounded-xl border border-line bg-white" />;
  if (traces.length === 0) return <LiveEmptyState what="A live release decision and gate status" />;

  const summary = summarizeGates(gates);
  const recommendation = getReleaseRecommendation(gates);
  const counts = [
    { label: "Passed", value: summary.Passed, color: "text-emerald-700" },
    { label: "Warning", value: summary.Warning, color: "text-amber-700" },
    { label: "Failed", value: summary.Failed, color: "text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <SectionHeader title="Release Decision (live)" icon={CircleCheckBig} />
          <div className="rounded-lg border border-line bg-slate-50 p-4 text-center">
            <p className="stat-label">From your sessions</p>
            <div className="mt-2 flex justify-center"><ReleaseBadge recommendation={recommendation} className="px-3 py-1 text-sm" /></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {counts.map((c) => (
              <div key={c.label} className="rounded-lg border border-line bg-white p-3 text-center">
                <p className={cn("text-2xl font-semibold", c.color)}>{c.value}</p>
                <p className="text-[11px] text-slatey-500">{c.label}</p>
              </div>
            ))}
          </div>
        </Panel>
        <InsightCard title="How this is computed" tone="info" className="lg:col-span-2">
          <p>
            These gates apply the lab's thresholds to the <span className="font-semibold text-ink">averages across your {traces.length} question
            {traces.length === 1 ? "" : "s"}</span>. The release decision follows the same hierarchy as the demo: any failed critical gate blocks,
            any failed high severity gate holds, any warning means promote-with-monitoring.
          </p>
        </InsightCard>
      </div>

      <Panel className="overflow-x-auto">
        <SectionHeader title="Quality Gate Status (live)" />
        <table className="data-table min-w-[760px]">
          <thead><tr><th>Gate</th><th>Threshold</th><th>Your avg</th><th>Status</th><th>Severity</th><th>Remediation</th></tr></thead>
          <tbody>
            {gates.map((g) => (
              <tr key={g.id}>
                <td><span className="font-medium text-ink">{g.name}</span><span className="mt-0.5 block text-[11px] text-slatey-500">{g.description}</span></td>
                <td className="whitespace-nowrap font-mono text-xs text-slatey-300">{g.threshold}</td>
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-ink">{g.currentValue}</td>
                <td><GateBadge status={g.status} /></td>
                <td><RiskBadge level={g.severity} /></td>
                <td className="max-w-[280px] text-xs text-slatey-400">{g.remediation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
