"use client";

import { TrendingUp } from "lucide-react";
import { useProgram, formatMoney } from "@labs/program-core";
import { RealizeView } from "@labs/lab-realize";
import { PageIntro } from "@labs/design-system";
import { StagePlaceholder } from "@/components/shell/StagePlaceholder";
import { StageDemonstrates } from "@/components/reviewer/Reviewer";
import { StageThread } from "@/components/story/StageThread";

// Stage 06 · Realize, its own lab now (split out of Govern). The risk adjusted
// business case where every number traces back to an upstream decision.
// Money renders through the shared formatter (R1.4), one style program-wide.
const fmtUsd = formatMoney;

export function RealizeStage() {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.realize === "locked") return <StagePlaceholder stageKey="realize" />;

  const varUsd = state.operate?.valueAtRiskUsd;
  const rav = state.outcomes?.riskAdjustedValue;

  return (
    <div>
      <PageIntro eyebrow="Stage 06 · Realize" title="What is it actually worth?" icon={TrendingUp}>
        The payoff. A risk adjusted business case assembled from every upstream decision: addressable value minus the
        adoption, quality, run cost, and risk leaks, where each number traces back to the stage that produced it.
      </PageIntro>
      <StageThread stage="realize" />
      <div className="mb-5"><StageDemonstrates>business value realization through adoption, leakage, run cost, risk discount, ROI, payback, and risk adjusted value.</StageDemonstrates></div>
      {typeof varUsd === "number" && varUsd > 0 && (
        <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Open day two exposure · from Operate</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink">
            A production breach is exposing <b>{fmtUsd(varUsd)}/yr</b> of the risk adjusted value.
            {typeof rav === "number" && (
              <> Net of it, the case stands at <b>{fmtUsd(rav - varUsd)}/yr</b> until the Operate remediation lands.</>
            )}
          </p>
          {state.operate?.decisionLabel && (
            <p className="mt-1 text-xs text-slatey-500">Remediation chosen: {state.operate.decisionLabel}. The realized figures below are gross of this open exposure.</p>
          )}
        </div>
      )}
      <RealizeView />
    </div>
  );
}
