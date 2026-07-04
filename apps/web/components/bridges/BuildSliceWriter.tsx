"use client";

import { useEffect, useRef } from "react";
import { useProgram } from "@labs/program-core";
import { loadStoredTraces, aggregateLiveMetrics } from "@rag/lib/live-lab/liveMetrics";

// Writes the real RAG evaluator metrics into ProgramState.rag — this is what makes
// Deploy's escalation cost and Realize's quality factor *live*. Reuses the RAG
// lab's own aggregation over its persisted traces.
export function BuildSliceWriter() {
  const { update, hydrated } = useProgram();
  const last = useRef<string>("");

  useEffect(() => {
    if (!hydrated) return;
    const sync = () => {
      const m = aggregateLiveMetrics(loadStoredTraces());
      if (!m.questionsAsked) return;
      const slice = {
        faithfulness: m.averageFaithfulness,
        citationAccuracy: m.averageCitationAccuracy,
        hallucination: m.averageHallucinationRisk,
        costPerAnswer: m.averageEstimatedCost,
        status: "active",
      };
      const sig = JSON.stringify(slice);
      if (sig === last.current) return;
      last.current = sig;
      // Merge so the engine chosen in Model Fit (model, deployment, cost/latency
      // notes) survives the periodic metrics refresh.
      update((d) => { d.rag = { ...d.rag, ...slice }; });
    };
    sync();
    const id = setInterval(sync, 3000);
    return () => clearInterval(id);
  }, [hydrated, update]);

  return null;
}
