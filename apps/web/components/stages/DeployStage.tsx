"use client";

import { Rocket } from "lucide-react";
import { useProgram } from "@labs/program-core";
import { DeployView } from "@labs/lab-deploy";
import { PageIntro } from "@labs/design-system";
import { StagePlaceholder } from "@/components/shell/StagePlaceholder";
import { ReleaseReadinessPanel, OperateEvidencePanels } from "@/components/operate/OperateSpine";
import { NextStageCTA } from "@/components/lifecycle/NextStageCTA";
import { ReleaseBlockers } from "@/components/operate/ReleaseBlockers";
import { StageThread } from "@/components/story/StageThread";

// Stage 04 · Deploy · AI Ops ("make it run"; day two lives in 07 Operate).
// Vocabulary settled 2026-07-11 (R1.2). The existing operating-envelope engine
// is preserved; Phase 2 wraps it with release readiness, lineage, monitoring,
// regression, incidents, and an enriched ops-evidence handoff for Govern + Realize.
export function DeployStage() {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.deploy === "locked") return <StagePlaceholder stageKey="deploy" />;

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Stage 04 · Deploy · AI Ops" title="Does it run reliably, at what cost?" icon={Rocket}>
        Build proves the system can answer. Deploy proves it can run. This stage turns the Build/RAG output contract into
        production readiness evidence: release gates, version lineage, monitoring coverage, evaluation regression, drift,
        incidents, rollback options, and cost and latency controls. Day two, keeping it running, lives in Operate.
      </PageIntro>
      <StageThread stage="deploy" />
      <ReleaseBlockers />
      <ReleaseReadinessPanel />
      <DeployView />
      <OperateEvidencePanels />
      <NextStageCTA stage="deploy" />
    </div>
  );
}
