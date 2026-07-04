"use client";

import { useProgram } from "@labs/program-core";
import { StagePlaceholder } from "@/components/shell/StagePlaceholder";
import { HandoffBanner } from "@/components/shell/HandoffBanner";
import { PageIntro } from "@rag/components/common/PageIntro";
import { LiveLabView } from "@rag/components/live-lab/LiveLabView";
import { BuildContractCard } from "@/components/lifecycle/StageContracts";
import { StageDemonstrates } from "@/components/reviewer/Reviewer";
import { NextStageCTA } from "@/components/lifecycle/NextStageCTA";

// Stage 03. Locked until Framing completes, then the live RAG evaluator renders
// in the shared shell. (Operations/cost-latency now live in Deploy; maturity in Govern.)
export function BuildStage() {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.build === "locked") return <StagePlaceholder stageKey="build" />;

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Stage 03 · Build" title="Does the engine actually work?">
        Pick a sample or drop in your own file — the evaluator scores every answer in real time: retrieval,
        faithfulness, citation accuracy, and an honest quality verdict. This is where the bet&apos;s feasibility
        guess from Framing meets the truth.
      </PageIntro>
      <div className="mb-5"><StageDemonstrates>RAG build maturity through retrieval, evidence, citations, faithfulness, hallucination risk, traces, evaluations, and quality gates.</StageDemonstrates></div>
      <HandoffBanner stage="build" />
      {state.operate?.buildTask && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Looped back from Operate · day-2</p>
          <p className="mt-0.5 text-sm text-ink">{state.operate.buildTask}</p>
          {state.operate.evidenceNote && <p className="mt-1 text-xs leading-relaxed text-slatey-500">{state.operate.evidenceNote}</p>}
        </div>
      )}
      <LiveLabView />
      <BuildContractCard />
      <NextStageCTA stage="build" />
    </div>
  );
}
