import { Hash } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { cn } from "@rag/lib/cn";
import type { TokenAnalysis } from "@rag/lib/live-lab/tokenAnalysis";

const ROLE_STYLE = {
  matched: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  miss: "bg-amber-50 text-amber-700 ring-amber-600/20",
  common: "bg-slate-100 text-slate-500 ring-slate-400/20",
} as const;

const BAR = ["#1f6fc4", "#3f9c8f", "#7c6cae", "#e8943a", "#4a9d4a"];

export function TokenExplorer({ analysis }: { analysis: TokenAnalysis }) {
  const ctxMax = Math.max(analysis.contextTokens, 1);
  return (
    <Panel>
      <SectionHeader
        title="Token Explorer"
        description="How your question tokenizes, which tokens the retriever matched, and how the context window is built."
        icon={Hash}
      />

      {/* Question tokens */}
      <p className="stat-label mb-1.5">Your question, tokenized</p>
      <div className="flex flex-wrap gap-1.5">
        {analysis.questionTokens.map((t, i) => (
          <span key={i} className={cn("rounded-md px-2 py-1 text-sm ring-1 ring-inset", ROLE_STYLE[t.role])}>
            {t.text}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slatey-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-400" /> matched in context ({analysis.matchedCount})</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-400" /> not found ({analysis.missCount})</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-300" /> common / stopword</span>
      </div>
      {analysis.missCount > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-amber-700">
          {analysis.missCount} content {analysis.missCount === 1 ? "word was" : "words were"} not found in the retrieved context, those
          are where answers tend to go wrong. The evaluator weighs this as retrieval coverage.
        </p>
      )}

      {/* Context window composition */}
      <p className="stat-label mb-1.5 mt-5">Context window sent to the model ({analysis.contextTokens.toLocaleString()} tokens)</p>
      <div className="flex h-4 w-full overflow-hidden rounded-md ring-1 ring-inset ring-line">
        {analysis.contextChunks.map((c, i) => (
          <div
            key={c.label}
            className="h-full"
            style={{ width: `${(c.tokens / ctxMax) * 100}%`, background: BAR[i % BAR.length] }}
            title={`${c.label}: ${c.tokens} tokens`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slatey-400">
        {analysis.contextChunks.map((c, i) => (
          <span key={c.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ background: BAR[i % BAR.length] }} />
            {c.label} · {c.tokens} tok
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slatey-400">
        The retriever compressed a {analysis.documentTokens.toLocaleString()}-token document down to {analysis.contextTokens.toLocaleString()} tokens
        ({analysis.compression}% of the document), only the passages most likely to answer your question reach the model.
      </p>
    </Panel>
  );
}
