import type { Metadata } from "next";
import { HitlSimulator } from "@/components/agents/HitlSimulator";

export const metadata: Metadata = {
  title: "GAP-08 · Human Review and Autonomy Control Simulator",
  description:
    "Raise an agent's autonomy level and watch throughput climb, until an edge case slips through unreviewed. Find the level where risk tier and throughput balance. Autonomy is set per risk tier, not per enthusiasm.",
};

export default function Page() {
  return <HitlSimulator />;
}
