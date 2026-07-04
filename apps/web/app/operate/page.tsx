import type { Metadata } from "next";
import { OperateStage } from "@/components/stages/OperateStage";

export const metadata: Metadata = {
  title: "Operate · Day-2 Observability",
  description:
    "Stage 07 of the AI Program Command Center: the day-2 loop. Green SLOs while canary evals decay, an index-staleness incident, and the retrain / re-index / rollback / re-scope decision that feeds back to Frame and Build.",
};

export default function Page() {
  return <OperateStage />;
}
