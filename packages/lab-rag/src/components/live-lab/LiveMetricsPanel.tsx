import { Activity } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { TrendIndicator } from "@rag/components/common/TrendIndicator";
import { MetricTooltip } from "@rag/components/common/MetricTooltip";
import { EmptyState } from "@rag/components/common/EmptyState";
import type { LiveLabMetrics } from "@rag/types/liveLab";
import type { TrendDirection } from "@rag/types";

interface Props {
  metrics: LiveLabMetrics;
  previous?: LiveLabMetrics | null;
}

function trend(cur: number, prev?: number): { dir: TrendDirection; delta: number } | null {
  if (prev === undefined || prev === null) return null;
  const d = Math.round((cur - prev) * 10) / 10;
  return { dir: d > 0 ? "up" : d < 0 ? "down" : "flat", delta: d };
}

export function LiveMetricsPanel({ metrics, previous }: Props) {
  if (metrics.questionsAsked === 0) {
    return (
      <Panel>
        <SectionHeader title="Live Evaluation Metrics" description="Updates after every question, derived from stored traces." icon={Activity} />
        <EmptyState message="No questions evaluated yet. Metrics will populate as you ask questions." />
      </Panel>
    );
  }

  const cards: { label: string; value: string; raw: number; prev?: number; lower?: boolean; meaning: string; tip: string }[] = [
    { label: "Questions asked", value: String(metrics.questionsAsked), raw: metrics.questionsAsked, meaning: "Traces generated in this session.",
      tip: "The number of questions you have run through the evaluator in this session. Each one produces a trace that is scored and stored. More questions make the averages below more reliable." },
    { label: "Avg overall quality", value: `${metrics.averageOverallQuality}%`, raw: metrics.averageOverallQuality, prev: previous?.averageOverallQuality, meaning: "Composite trust score across questions.",
      tip: "The mean composite trust score across every question asked. Each answer's score blends retrieval relevance, faithfulness, citation accuracy, and hallucination risk into one number. It is the fastest read on whether the system is good enough to rely on." },
    { label: "Avg retrieval relevance", value: `${metrics.averageRetrievalRelevance}%`, raw: metrics.averageRetrievalRelevance, prev: previous?.averageRetrievalRelevance, meaning: "How well evidence matched the questions.",
      tip: "On average, how well the passages the retriever pulled matched the question. It is scored per question from the overlap between the question and the retrieved evidence. Weak retrieval caps everything downstream, since the model can only be as good as what it is given." },
    { label: "Avg faithfulness", value: `${metrics.averageFaithfulness}%`, raw: metrics.averageFaithfulness, prev: previous?.averageFaithfulness, meaning: "How grounded answers were in evidence.",
      tip: "On average, how much of each answer was actually supported by the retrieved evidence. It is the share of answer content that traces back to a source rather than being invented. Low faithfulness is the classic sign of hallucination." },
    { label: "Avg citation accuracy", value: `${metrics.averageCitationAccuracy}%`, raw: metrics.averageCitationAccuracy, prev: previous?.averageCitationAccuracy, meaning: "Whether citations supported the claims.",
      tip: "Of the citations the model attached, the average share that genuinely support the claim they sit next to. Each citation is checked against the statement it backs. It captures whether the sourcing is trustworthy, not just present." },
    { label: "Avg hallucination risk", value: `${metrics.averageHallucinationRisk}%`, raw: metrics.averageHallucinationRisk, prev: previous?.averageHallucinationRisk, lower: true, meaning: "Risk of unsupported content. Lower is better.",
      tip: "The average estimated risk that an answer contains unsupported content, where lower is better. It rises as faithfulness and citation accuracy fall. It is the single metric to watch before trusting answers in production." },
    { label: "Human review required", value: String(metrics.humanReviewRequiredCount), raw: metrics.humanReviewRequiredCount, lower: true, meaning: "Answers flagged for human review.",
      tip: "How many answers this session were flagged as needing a human to check them before use. An answer is flagged when its quality gate fails or its risk is too high. It captures how much human oversight the current setup still demands." },
    { label: "Avg latency", value: `${metrics.averageLatency}ms`, raw: metrics.averageLatency, lower: true, meaning: "Simulated end to end response time.",
      tip: "The average simulated end to end time to answer a question, in milliseconds. It sums retrieval, generation, and evaluation time. It is a stand in for the responsiveness users would feel in production." },
    { label: "Avg cost / query", value: `$${metrics.averageEstimatedCost.toFixed(5)}`, raw: metrics.averageEstimatedCost, lower: true, meaning: "Estimated using a sample pricing profile.",
      tip: "The average estimated cost to answer one question, using a sample pricing profile. It reflects the tokens used for retrieval and generation. It lets you weigh quality against what each answer would cost at scale." },
  ];

  return (
    <Panel>
      <SectionHeader title="Live Evaluation Metrics" description="Updates after every question, derived from stored traces." icon={Activity} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {cards.map((c) => {
          const t = trend(c.raw, c.prev);
          return (
            <div key={c.label} className="rounded-lg border border-slate-100 bg-navy-850/40 p-3">
              <div className="flex items-center gap-1">
                <p className="stat-label">{c.label}</p>
                <MetricTooltip text={c.tip} />
              </div>
              <div className="mt-0.5 flex items-end justify-between gap-1">
                <span className="text-lg font-semibold text-ink">{c.value}</span>
                {t && t.delta !== 0 && (
                  <TrendIndicator direction={t.dir} value={t.delta} suffix={c.label.includes("%") ? "" : ""} goodWhen={c.lower ? "down" : "up"} />
                )}
              </div>
              <p className="mt-1 text-xs leading-snug text-slatey-400">{c.meaning}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-slatey-500">
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700">Passed {metrics.passedQualityGates}</span>
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700">Warning {metrics.warningQualityGates}</span>
        <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-700">Failed {metrics.failedQualityGates}</span>
      </div>
    </Panel>
  );
}
