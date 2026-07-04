"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import { GateBadge } from "@rag/components/common/Badge";
import { aggregateLiveMetrics, loadStoredTraces } from "@rag/lib/live-lab/liveMetrics";
import type { LiveLabMetrics, LiveRagLabTrace } from "@rag/types/liveLab";

// Reads live-lab traces from localStorage (client-only) and surfaces a summary
// on the Executive Overview. Renders nothing until mounted to stay SSR-safe.
export function LiveLabActivityCard() {
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<LiveLabMetrics | null>(null);
  const [latest, setLatest] = useState<LiveRagLabTrace | null>(null);

  useEffect(() => {
    const traces = loadStoredTraces();
    setMetrics(aggregateLiveMetrics(traces));
    setLatest(traces[0] ?? null);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasActivity = metrics && metrics.questionsAsked > 0;

  return (
    <Link href="/build" className="panel panel-hover block p-5 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent-cyan ring-1 ring-inset ring-accent/20">
            <FlaskConical className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Live Lab Activity</h2>
            <p className="text-[11px] text-slatey-500">Traces generated in your browser</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slatey-500" />
      </div>

      {hasActivity && latest ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Questions evaluated" value={String(metrics!.questionsAsked)} />
          <Stat label="Avg live quality" value={`${metrics!.averageOverallQuality}%`} />
          <Stat label="Human review required" value={String(metrics!.humanReviewRequiredCount)} />
          <div>
            <p className="stat-label">Latest quality gate</p>
            <div className="mt-1"><GateBadge status={latest.evaluation.qualityGateStatus} /></div>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-slatey-400">
          No live evaluations yet. Open the Live RAG Evaluator Lab, load a sample document, and ask a question to generate real RAG
          traces scored in real time.
        </p>
      )}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
