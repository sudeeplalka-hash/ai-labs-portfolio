import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { HitlSimulator } from "@/components/agents/HitlSimulator";

export const metadata: Metadata = {
  ...routeMetadata("GAP-08 \u00b7 Human Review and Autonomy Control Simulator", "Inspect gap-08 \u00b7 human review and autonomy control simulator through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/hitl"),
  title: "GAP-08 · Human Review and Autonomy Control Simulator",
  description:
    "Raise an agent's autonomy level and watch throughput climb, until an edge case slips through unreviewed. Find the level where risk tier and throughput balance. Autonomy is set per risk tier, not per enthusiasm.",
};

export default function Page() {
  return <HitlSimulator />;
}
