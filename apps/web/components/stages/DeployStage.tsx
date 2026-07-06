"use client";

import { Rocket } from "lucide-react";
import { useProgram } from "@labs/program-core";
import { DeployView } from "@labs/lab-deploy";
import { PageIntro } from "@labs/design-system";
import { StagePlaceholder } from "@/components/shell/StagePlaceholder";
import { ReleaseReadinessPanel, OperateEvidencePanels } from "@/components/operate/OperateSpine";
import { NextStageCTA } from "@/components/lifecycle/NextStageCTA";
import { ReleaseBlockers } from "@/components/operate/ReleaseBlockers";

// Stage 04, Operate (AI Ops · MLOps · LLMOps). Route stays /deploy for
// compatibility. The existing operating-envelope engine is preserved; Phase 2
// wraps it with release readiness, lineage, monitoring, regression, incidents,
// and an enriched ops-evidence handoff for Govern + Realize.
export function DeployStage() {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.deploy === "locked") return <StagePlaceholder stageKey="deploy" />;

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Stage 04 · Operate, AI Ops · MLOps · LLMOps" title="Does it run reliably, at what cost?" icon={Rocket}>
        Build proves the system can answer. Operate proves it can run. This stage turns the Build/RAG output contract into
        production readiness evidence: release gates, version lineage, monitoring coverage, evaluation regression, drift,
        incidents, rollback options, and cost and latency controls.
      </PageIntro>
      <ReleaseBlockers />
      <ReleaseReadinessPanel />
      <DeployView />
      <OperateEvidencePanels />
      <NextStageCTA stage="deploy" />
    </div>
  );
}
