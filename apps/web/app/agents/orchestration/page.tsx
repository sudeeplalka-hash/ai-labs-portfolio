import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { OrchestrationBoard } from "@/components/agents/OrchestrationBoard";

export const metadata: Metadata = {
  ...routeMetadata("GAP-03 \u00b7 Multiagent Orchestration Economics Board", "Inspect gap-03 \u00b7 multiagent orchestration economics board through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/orchestration"),
  title: "GAP-03 · Multiagent Orchestration Economics Board",
  description:
    "Watch a supervisor decompose a goal, agents coordinate over A2A style messages, and a result assemble, with a running cost, latency, and quality meter that shows when multiagent is actually worth it.",
};

export default function Page() {
  return <OrchestrationBoard />;
}
