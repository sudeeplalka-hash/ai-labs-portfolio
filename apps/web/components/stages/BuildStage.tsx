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
      <LiveLabView />
      <BuildContractCard />
      <NextStageCTA stage="build" />
    </div>
  );
}
