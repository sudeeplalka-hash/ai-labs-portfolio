"use client";

import { TrendingUp } from "lucide-react";
import { useProgram } from "@labs/program-core";
import { RealizeView } from "@labs/lab-realize";
import { PageIntro } from "@labs/design-system";
import { StagePlaceholder } from "@/components/shell/StagePlaceholder";
import { StageDemonstrates } from "@/components/reviewer/Reviewer";

// Stage 06 · Realize — its own lab now (split out of Govern). The risk-adjusted
// business case where every number traces back to an upstream decision.
export function RealizeStage() {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.realize === "locked") return <StagePlaceholder stageKey="realize" />;

  return (
    <div>
      <PageIntro eyebrow="Stage 06 · Realize" title="What is it actually worth?" icon={TrendingUp}>
        The payoff. A risk adjusted business case assembled from every upstream decision: addressable value minus the
        adoption, quality, run cost, and risk leaks, where each number traces back to the stage that produced it.
      </PageIntro>
      <div className="mb-5"><StageDemonstrates>business-value realization through adoption, leakage, run cost, risk discount, ROI, payback, and risk-adjusted value.</StageDemonstrates></div>
      <RealizeView />
    </div>
  );
}
