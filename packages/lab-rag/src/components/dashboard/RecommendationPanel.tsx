import { ListChecks, ArrowRight } from "lucide-react";
import { RiskBadge } from "@rag/components/common/Badge";
import type { RiskLevel } from "@rag/types";

const ACTIONS: { owner: string; action: string; priority: RiskLevel }[] = [
  { owner: "Engineering", action: "Ship claim-to-evidence overlap validation to lift citation accuracy past 85%.", priority: "High" },
  { owner: "Engineering", action: "Cache reranker scores and trim candidate count to bring P95 latency under 4s.", priority: "High" },
  { owner: "Compliance", action: "Resolve the open critical failure on external AI tool data-use guidance.", priority: "Critical" },
  { owner: "Data / Content", action: "Remove retired Travel Policy v2.7 and revise AI Governance v1.3 ambiguous sections.", priority: "High" },
  { owner: "Product", action: "Expand golden dataset coverage for finance and legal high risk queries.", priority: "Medium" },
];

export function RecommendationPanel() {
  return (
    <div className="panel p-5 animate-fade-in">
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-accent-cyan" />
        <h2 className="text-sm font-semibold text-ink">Recommended Actions</h2>
      </div>
      <ul className="space-y-2.5">
        {ACTIONS.map((a, i) => (
          <li key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-navy-850/50 p-3">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slatey-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink">{a.owner}</span>
                <RiskBadge level={a.priority} />
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slatey-400">{a.action}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
