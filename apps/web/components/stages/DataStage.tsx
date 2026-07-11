"use client";

import { useProgram } from "@labs/program-core";
import { StagePlaceholder } from "@/components/shell/StagePlaceholder";
import { HandoffBanner } from "@/components/shell/HandoffBanner";
import { PageIntro } from "@data/components/common/PageIntro";
import { DataLabView } from "@data/components/live/DataLabView";
import { DataHandoffCard } from "@/components/lifecycle/StageContracts";
import { DataPurposes } from "@/components/data/DataPurposes";
import { StageDemonstrates } from "@/components/reviewer/Reviewer";
import { NextStageCTA } from "@/components/lifecycle/NextStageCTA";
import { SourceWhatIf } from "@/components/data/SourceWhatIf";
import { StageThread } from "@/components/story/StageThread";

// Stage 02. Locked until Framing completes, then the real Data lab renders in the
// shared shell, with the framed bet carried over.
export function DataStage() {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.data === "locked") return <StagePlaceholder stageKey="data" />;

  return (
    <div>
      <PageIntro eyebrow="Stage 02 · Data" title="Is your data ready for AI?">
        Drop in a CSV, JSON, Markdown, or text file. The Data Lab profiles it, applies your organization&apos;s
        ingestion guidelines, clears sensitive data, previews chunking, and gives an honest readiness verdict,
        then hands the approved corpus to the RAG evaluator. Everything runs locally.
      </PageIntro>
      <StageThread stage="data" />
      <div className="mb-5"><StageDemonstrates>AI readiness depends on source quality, ownership, sensitivity, metadata, provenance, chunk readiness, and exclusion decisions before build.</StageDemonstrates></div>
      <HandoffBanner stage="data" />
      <DataLabView />
      <div className="mt-6 space-y-6"><DataHandoffCard /><SourceWhatIf /><DataPurposes /></div>
      <NextStageCTA stage="data" />
    </div>
  );
}
