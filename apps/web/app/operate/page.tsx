import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { OperateStage } from "@/components/stages/OperateStage";

export const metadata: Metadata = {
  ...routeMetadata("Operate \u00b7 Day Two Observability", "Inspect operate \u00b7 day two observability through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/operate"),
  title: "Operate · Day Two Observability",
  description:
    "Stage 07 of the AI Program Command Center: the day two loop. Green SLOs while canary evals decay, an index staleness incident, and the retrain, reindex, rollback, or rescope decision that feeds back to Frame and Build.",
};

export default function Page() {
  return <OperateStage />;
}
