"use client";

import { useState } from "react";
import {
  Search,
  ArrowRightLeft,
  Bot,
  Target,
  Clock,
  AlertOctagon,
  UserCheck,
  Layers,
} from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { RiskBadge, EvalStatusBadge } from "@rag/components/common/Badge";
import { Tabs } from "@rag/components/common/Tabs";
import { RetrievedChunkCard } from "./RetrievedChunkCard";
import { TraceTimeline } from "./TraceTimeline";
import { EvaluationScorePanel } from "./EvaluationScorePanel";
import { ClaimVerificationPanel } from "@rag/components/claims/ClaimVerificationPanel";
import { queryTraces } from "@rag/data/queryTraces";
import { cn } from "@rag/lib/cn";

export function TraceExplorer() {
  const [selectedId, setSelectedId] = useState(queryTraces[1].id);
  const [query, setQuery] = useState("");
  const trace = queryTraces.find((t) => t.id === selectedId)!;

  const filtered = queryTraces.filter((t) =>
    t.question.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Trace list */}
      <Panel className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slatey-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traces..."
            className="w-full rounded-lg border border-line bg-navy-950/60 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-slatey-500 focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cn(
                "w-full rounded-lg border p-2.5 text-left transition-colors",
                t.id === selectedId
                  ? "border-accent/40 bg-accent/10"
                  : "border-slate-100 bg-navy-850/40 hover:border-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slatey-500">{t.category}</span>
                <RiskBadge level={t.riskLevel} />
              </div>
              <p className="mt-1 line-clamp-2 text-xs font-medium text-ink">{t.question}</p>
              <div className="mt-1.5">
                <EvalStatusBadge status={t.evaluationStatus} />
              </div>
            </button>
          ))}
        </div>
      </Panel>

      {/* Trace detail */}
      <div className="space-y-6">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">{trace.question}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <Meta label="Category" value={trace.category} />
                <Meta label="Type" value={trace.queryType} />
                <Meta label="Expected source" value={trace.expectedSource} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <RiskBadge level={trace.riskLevel} />
              <EvalStatusBadge status={trace.evaluationStatus} />
              {trace.humanReviewRequired && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/30">
                  <UserCheck className="h-3 w-3" /> Human review
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-navy-850/50 p-3">
              <p className="mb-1 flex items-center gap-1.5 stat-label">
                <ArrowRightLeft className="h-3 w-3" /> Query rewriting
              </p>
              <p className="text-xs text-slatey-400">
                <span className="text-slatey-500">Original:</span> {trace.originalQuery}
              </p>
              <p className="mt-1 text-xs text-slatey-300">
                <span className="text-slatey-500">Rewritten:</span> {trace.rewrittenQuery}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-navy-850/50 p-3">
              <p className="mb-1 flex items-center gap-1.5 stat-label">
                <Clock className="h-3 w-3" /> Latency
              </p>
              <p className="text-lg font-semibold text-ink">
                {(trace.timeline.reduce((a, s) => a + s.durationMs, 0) / 1000).toFixed(2)}s
              </p>
              <p className="text-[11px] text-slatey-500">End-to-end across {trace.timeline.length} steps</p>
            </div>
          </div>

          {trace.failureReasons.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] p-3">
              <AlertOctagon className="h-4 w-4 shrink-0 text-rose-700" />
              <span className="text-xs font-medium text-rose-700">Failure reasons:</span>
              {trace.failureReasons.map((r) => (
                <span key={r} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[11px] text-rose-700">
                  {r}
                </span>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent-cyan" />
              <h3 className="text-sm font-semibold text-ink">Generated Answer</h3>
            </div>
            <p className="text-sm leading-relaxed text-slatey-300">{trace.generatedAnswer}</p>
          </Panel>
          <Panel>
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-ink">Expected Answer</h3>
            </div>
            <p className="text-sm leading-relaxed text-slatey-300">{trace.expectedAnswer}</p>
          </Panel>
        </div>

        <Panel>
          <Tabs
            tabs={[
              {
                id: "claims",
                label: "Claim Verification",
                content: <ClaimVerificationPanel claims={trace.claimVerifications} />,
              },
              {
                id: "chunks",
                label: `Retrieved Chunks (${trace.retrievedChunks.length})`,
                content: (
                  <div className="space-y-2">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slatey-400">
                      <Layers className="h-3.5 w-3.5" /> Ranked evidence after hybrid retrieval and reranking.
                    </div>
                    {trace.retrievedChunks.map((c) => (
                      <RetrievedChunkCard key={c.id} chunk={c} />
                    ))}
                  </div>
                ),
              },
              {
                id: "scores",
                label: "Evaluation Scores",
                content: <EvaluationScorePanel scores={trace.scores} />,
              },
              {
                id: "timeline",
                label: "Trace Timeline",
                content: <TraceTimeline steps={trace.timeline} />,
              },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded bg-slate-50 px-2 py-0.5 text-slatey-300">
      <span className="text-slatey-500">{label}:</span> {value}
    </span>
  );
}
