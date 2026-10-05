import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { BuildBuyEvaluator } from "@/components/business/BuildBuyEvaluator";

export const metadata: Metadata = {
  ...routeMetadata("C3-2 \u00b7 Build, Buy, or Fine Tune Decision Evaluator", "Inspect c3-2 \u00b7 build, buy, or fine tune decision evaluator through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/business/build-buy"),
  title: "C3-2 · Build, Buy, or Fine Tune Decision Evaluator",
  description:
    "Compare API, fine tune/self host, and buy across a 3 year TCO and a weighted score, then see the condition that flips the recommendation. The flip conditions matter more than the answer.",
};

export default function Page() {
  return <BuildBuyEvaluator />;
}
