"use client";

import { useMemo } from "react";
import { MessageSquareText, AlertTriangle } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { StatusBadge, GateBadge } from "@rag/components/common/Badge";
import { ScoreBar } from "@rag/components/common/ScoreBar";
import { useLiveTraces } from "./useLiveTraces";
import { LiveEmptyState } from "./LiveEmptyState";
import { statusFromScore, statusFromRiskValue } from "@rag/lib/formatting";
import type { Status } from "@rag/types";

const avg = (ns: number[]) => (ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0);

export function LiveAnswerQuality() {
  const { mounted, traces } = useLiveTraces();
  const evals = useMemo(() => traces.map((t) => t.evaluation), [traces]);

  if (!mounted) return <div className="h-40 animate-pulse rounded-xl border border-line bg-white" />;
  if (traces.length === 0) return <LiveEmptyState what="Answer-quality metrics" />;

  const metrics = [
    { label: "Faithfulness", value: avg(evals.map((e) => e.faithfulness)), target: 85, lower: false },
    { label: "Completeness", value: avg(evals.map((e) => e.answerCompleteness)), target: 85, lower: false },
    { label: "Citation Accuracy", value: avg(evals.map((e) => e.citationAccuracy)), target: 85, lower: false },
    { label: "Retrieval Relevance", value: avg(evals.map((e) => e.retrievalRelevance)), target: 80, lower: false },
    { label: "Context Utilization", value: avg(evals.map((e) => e.contextUtilization)), target: 70, lower: false },
    { label: "Hallucination Risk", value: avg(evals.map((e) => e.hallucinationRisk)), target: 8, lower: true },
  ];

  const flagged = traces.filter((t) => t.evaluation.qualityGateStatus !== "Passed");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {metrics.map((m) => {
          const status = (m.lower ? statusFromRiskValue(m.value, m.target) : statusFromScore(m.value, m.target)) as Status;
          return (
            <div key={m.label} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="stat-label">{m.label}</span>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-2xl font-semibold text-ink">{m.value}%</p>
              <div className="mt-2">
                <ScoreBar value={m.value} target={m.target} mode={m.lower ? "lower-better" : "higher-better"} showValue={false} />
              </div>
            </div>
          );
        })}
      </div>

      <Panel>
        <SectionHeader
          title={flagged.length ? "Answers that need review" : "Your answers"}
          description={flagged.length ? "Questions where the evaluator flagged a Warning or Failed gate." : "All your answers passed the quality gate."}
          icon={flagged.length ? AlertTriangle : MessageSquareText}
        />
        {(flagged.length ? flagged : traces).slice(0, 8).map((t) => (
          <div key={t.id} className="border-b border-line py-3 last:border-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink">{t.question}</p>
              <GateBadge status={t.evaluation.qualityGateStatus} />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slatey-400">{t.generatedAnswer.answer}</p>
            {t.evaluation.failureReasons.length > 0 && t.evaluation.qualityGateStatus !== "Passed" && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {t.evaluation.failureReasons.slice(0, 3).map((r, i) => (
                  <span key={i} className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700 ring-1 ring-inset ring-amber-600/20">{r}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </Panel>
    </div>
  );
}
