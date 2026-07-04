import { Layers, FlaskConical, Scissors } from "lucide-react";
import { PageIntro } from "@rag/components/common/PageIntro";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { MetricTooltip } from "@rag/components/common/MetricTooltip";
import { RetrievalStrategyChart } from "@rag/components/retrieval/RetrievalStrategyChart";
import {
  retrievalExperiments,
  chunkingExperiments,
  retrievalMetricCards,
} from "@rag/data/retrievalExperiments";
import { RetrievalModes } from "@/components/build/RetrievalModes";

function formatMetric(value: number, format: string) {
  if (format === "ratio") return value.toFixed(2);
  return `${value}%`;
}

export const metadata = { title: "Retrieval Quality" };

export default function RetrievalPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Retrieval Quality" title="Did the system find the right evidence?">
        Retrieval is the foundation of RAG quality: if the right chunks never surface, no prompt can fix the answer. Hybrid search
        plus reranking lifted retrieval above target, at the cost of added latency.
      </PageIntro>

      {/* Phase 3 — retrieval substrate: modes, comparison, re-rank, vector readiness */}
      <RetrievalModes />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {retrievalMetricCards.map((m) => {
          const lower = m.format === "pct-low";
          const ok = lower ? m.value <= m.target : m.value >= m.target;
          return (
            <div key={m.id} className="panel p-4">
              <div className="flex items-center gap-1.5">
                <span className="stat-label">{m.label}</span>
                <MetricTooltip text={m.interpretation} />
              </div>
              <p className={"mt-1 text-2xl font-semibold " + (ok ? "text-ink" : "text-orange-700")}>
                {formatMetric(m.value, m.format)}
              </p>
              <p className="text-[11px] text-slatey-500">target {formatMetric(m.target, m.format === "ratio" ? "ratio" : "pct")}</p>
            </div>
          );
        })}
      </div>

      <Panel>
        <SectionHeader title="Retrieval Strategy Comparison" description="Precision, recall, and ranking quality across six retrieval strategies." icon={Layers} />
        <RetrievalStrategyChart />
      </Panel>

      <Panel className="overflow-x-auto">
        <SectionHeader title="Strategy Experiments" description="Full metric breakdown with latency and cost tradeoffs." icon={FlaskConical} />
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>Strategy</th>
              <th>P@5</th>
              <th>R@5</th>
              <th>MRR</th>
              <th>NDCG</th>
              <th>Retrieval</th>
              <th>Faithfulness</th>
              <th>Latency</th>
              <th>Cost</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {retrievalExperiments.map((e) => (
              <tr key={e.id}>
                <td className="font-medium text-ink">{e.strategy}</td>
                <td>{e.precisionAtK.toFixed(2)}</td>
                <td>{e.recallAtK.toFixed(2)}</td>
                <td>{e.mrr.toFixed(2)}</td>
                <td>{e.ndcg.toFixed(2)}</td>
                <td className="font-semibold text-ink">{e.retrievalScore}</td>
                <td>{e.faithfulnessScore}</td>
                <td className="whitespace-nowrap text-slatey-400">{e.latencyMs}ms</td>
                <td className="whitespace-nowrap text-slatey-400">${e.costPerQuery.toFixed(3)}</td>
                <td className="max-w-[240px] text-xs text-slatey-400">{e.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel className="overflow-x-auto">
        <SectionHeader title="Chunking Experiments" description="Chunk size and strategy sweep with hybrid + reranking held constant." icon={Scissors} />
        <table className="data-table min-w-[980px]">
          <thead>
            <tr>
              <th>Chunking</th>
              <th>Size</th>
              <th>Overlap</th>
              <th>P@5</th>
              <th>R@5</th>
              <th>NDCG</th>
              <th>Retrieval</th>
              <th>Latency</th>
              <th>Cost</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {chunkingExperiments.map((e) => (
              <tr key={e.id}>
                <td className="font-medium text-ink">{e.chunkingStrategy}</td>
                <td className="whitespace-nowrap text-slatey-300">{e.chunkSize}</td>
                <td className="whitespace-nowrap text-slatey-400">{e.overlap}</td>
                <td>{e.precisionAtK.toFixed(2)}</td>
                <td>{e.recallAtK.toFixed(2)}</td>
                <td>{e.ndcg.toFixed(2)}</td>
                <td className="font-semibold text-ink">{e.retrievalScore}</td>
                <td className="whitespace-nowrap text-slatey-400">{e.latencyMs}ms</td>
                <td className="whitespace-nowrap text-slatey-400">${e.costPerQuery.toFixed(3)}</td>
                <td className="max-w-[240px] text-xs text-slatey-400">{e.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
