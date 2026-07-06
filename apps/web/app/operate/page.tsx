import type { Metadata } from "next";
import { OperateStage } from "@/components/stages/OperateStage";

export const metadata: Metadata = {
  title: "Operate · Day Two Observability",
  description:
    "Stage 07 of the AI Program Command Center: the day two loop. Green SLOs while canary evals decay, an index staleness incident, and the retrain, reindex, rollback, or rescope decision that feeds back to Frame and Build.",
};

export default function Page() {
  return <OperateStage />;
}
