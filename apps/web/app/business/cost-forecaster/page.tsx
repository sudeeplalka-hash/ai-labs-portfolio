import type { Metadata } from "next";
import { InferenceForecaster } from "@/components/business/InferenceForecaster";

export const metadata: Metadata = {
  title: "C3-3 · Inference Cost Forecaster",
  description:
    "Project 24 months of inference run-rate across a model mix and find the cliff — the month where amortized self-host undercuts API spend. Utilization decides where it lands.",
};

export default function Page() {
  return <InferenceForecaster />;
}
