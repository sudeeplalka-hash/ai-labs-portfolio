import { BookOpen } from "lucide-react";
import { PRODUCT_THESIS } from "@rag/lib/constants";

export function ReadThisDashboard() {
  return (
    <div className="panel overflow-hidden p-0 animate-fade-in">
      <div className="bg-gradient-to-r from-accent/15 via-accent-cyan/10 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-sm font-semibold text-ink">How to Read This Dashboard</h2>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
        <p className="text-sm leading-relaxed text-slatey-300 md:col-span-3">
          {PRODUCT_THESIS}
        </p>
        <div>
          <p className="text-xs font-semibold text-ink">Executive view</p>
          <p className="mt-1 text-xs leading-relaxed text-slatey-400">
            The KPI cards, quality trend, and release recommendation summarize whether the system is ready for production and where the risk sits.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink">Technical view</p>
          <p className="mt-1 text-xs leading-relaxed text-slatey-400">
            Trace Explorer, Retrieval, and Answer Quality let engineers inspect chunks, ranking, citations, and claim-level support behind each score.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink">Governance view</p>
          <p className="mt-1 text-xs leading-relaxed text-slatey-400">
            Failure Analysis, Governance, and Quality Gates connect quality signals to root causes, maturity, and the release decision.
          </p>
        </div>
      </div>
    </div>
  );
}
