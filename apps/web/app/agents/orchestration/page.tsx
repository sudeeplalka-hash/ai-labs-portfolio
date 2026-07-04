import type { Metadata } from "next";
import { OrchestrationBoard } from "@/components/agents/OrchestrationBoard";

export const metadata: Metadata = {
  title: "GAP-03 · Multi-Agent Orchestration Board",
  description:
    "Watch a supervisor decompose a goal, agents coordinate over A2A-style messages, and a result assemble — with a running cost, latency, and quality meter that shows when multi-agent is actually worth it.",
};

export default function Page() {
  return <OrchestrationBoard />;
}
