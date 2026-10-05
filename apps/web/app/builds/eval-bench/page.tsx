import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { EvalBench } from "@/components/builds/EvalBench";

export const metadata: Metadata = {
  ...routeMetadata("LB-03 \u00b7 Model Evaluation & Threshold Economics", "Inspect lb-03 \u00b7 model evaluation & threshold economics through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/builds/eval-bench"),
  title: "LB-03 · Model Evaluation & Threshold Economics",
  description:
    "Choose a fraud-review threshold and compare review cost with missed-loss cost on a seeded synthetic corpus. Inspect synchronized ROC, precision/recall, calibration, and exact decision tables.",
};

export default function Page() {
  return <EvalBench />;
}
