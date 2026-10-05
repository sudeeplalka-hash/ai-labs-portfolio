import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { InferenceForecaster } from "@/components/business/InferenceForecaster";

export const metadata: Metadata = {
  ...routeMetadata("C3-3 \u00b7 Inference Run Rate Forecaster", "Inspect c3-3 \u00b7 inference run rate forecaster through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/business/cost-forecaster"),
  title: "C3-3 · Inference Run Rate Forecaster",
  description:
    "Project 24 months of inference run rate across a model mix and find the cliff, the month where amortized self host undercuts API spend. Utilization decides where it lands.",
};

export default function Page() {
  return <InferenceForecaster />;
}
