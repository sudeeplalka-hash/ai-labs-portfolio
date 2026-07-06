import type { Metadata } from "next";
import { BuildBuyEvaluator } from "@/components/business/BuildBuyEvaluator";

export const metadata: Metadata = {
  title: "C3-2 · Build-vs-Buy-vs-Fine tune Evaluator",
  description:
    "Compare API, fine tune/self-host, and buy across a 3-year TCO and a weighted score, then see the condition that flips the recommendation. The flip conditions matter more than the answer.",
};

export default function Page() {
  return <BuildBuyEvaluator />;
}
