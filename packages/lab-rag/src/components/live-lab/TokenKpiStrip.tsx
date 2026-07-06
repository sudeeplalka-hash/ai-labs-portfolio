import { MetricTooltip } from "@rag/components/common/MetricTooltip";
import type { TokenAnalysis } from "@rag/lib/live-lab/tokenAnalysis";

// Complementary token-economics KPIs (mirrors the dashboard KPI style).
export function TokenKpiStrip({ analysis }: { analysis: TokenAnalysis }) {
  const cards = [
    { label: "Token coverage", value: `${analysis.coverage}%`, hint: "Share of your question's content words that appear in the retrieved context. Low coverage is a leading cause of weak answers." },
    { label: "Input tokens", value: analysis.inputTokens.toLocaleString(), hint: "Question + retrieved context + system prompt, what the model would receive." },
    { label: "Output tokens", value: analysis.outputTokens.toLocaleString(), hint: "Tokens in the generated answer." },
    { label: "Context window", value: analysis.contextTokens.toLocaleString(), hint: "Tokens of retrieved evidence packed into the prompt." },
    { label: "Compression", value: `${analysis.compression}%`, hint: "Context tokens as a share of the whole document, retrieval keeps the prompt small." },
    { label: "Est. cost", value: `$${analysis.estCost.toFixed(5)}`, hint: "Estimated with a sample model pricing profile (GPT-4o-mini-class)." },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="panel p-4">
          <div className="flex items-center gap-1.5">
            <span className="stat-label">{c.label}</span>
            <MetricTooltip text={c.hint} />
          </div>
          <p className="mt-1 text-xl font-semibold text-ink">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
