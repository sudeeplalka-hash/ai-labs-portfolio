"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight, Trash2 } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { EmptyState } from "@rag/components/common/EmptyState";
import { LiveTraceList } from "@rag/components/live-lab/LiveTraceList";
import { LiveTraceDetail } from "@rag/components/live-lab/LiveTraceDetail";
import { loadStoredTraces, clearStoredTraces } from "@rag/lib/live-lab/liveMetrics";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

// Reads live-lab traces from localStorage (client-only) and presents them in the
// same master-detail style as the mock Query Trace Explorer.
export function LiveTracesView() {
  const [mounted, setMounted] = useState(false);
  const [traces, setTraces] = useState<LiveRagLabTrace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStoredTraces();
    setTraces(stored);
    setSelectedId(stored[0]?.id ?? null);
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-xl border border-line bg-navy-900/40" />;
  }

  if (traces.length === 0) {
    return (
      <Panel>
        <SectionHeader title="Live Lab Traces" description="Traces you generate in the Live RAG Evaluator Lab appear here." icon={FlaskConical} />
        <EmptyState message="No live traces yet." />
        <div className="mt-4 flex justify-center">
          <Link
            href="/build"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent-cyan ring-1 ring-inset ring-accent/30 hover:bg-accent/25"
          >
            <FlaskConical className="h-4 w-4" /> Open the Live RAG Evaluator Lab <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Panel>
    );
  }

  const active = traces.find((t) => t.id === selectedId) ?? traces[0];

  const handleClear = () => {
    clearStoredTraces();
    setTraces([]);
    setSelectedId(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Panel className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold text-ink">Live Lab Traces</h2>
            <span className="text-[11px] text-slatey-500">({traces.length})</span>
          </div>
          <button onClick={handleClear} className="text-slatey-500 hover:text-rose-700" aria-label="Clear live traces">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <LiveTraceList traces={traces} activeId={active.id} onSelect={setSelectedId} />
      </Panel>

      <LiveTraceDetail trace={active} />
    </div>
  );
}
