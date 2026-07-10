import type { Metadata } from "next";
import { EvalBench } from "@/components/builds/EvalBench";

export const metadata: Metadata = {
  title: "LB-03 · Model Evaluation & Threshold Economics",
  description:
    "A logistic model trained live in the browser on a disclosed synthetic corpus: real ROC, precision/recall, calibration, and a cost-vs-threshold curve that turns the operating point into dollars.",
};

export default function Page() {
  return <EvalBench />;
}
