import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { LoopInspector } from "@/components/agents/LoopInspector";

export const metadata: Metadata = {
  ...routeMetadata("GAP-02 \u00b7 Agent Failure and Recovery Inspector", "Inspect gap-02 \u00b7 agent failure and recovery inspector through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/loop-inspector"),
  title: "GAP-02 · Agent Failure and Recovery Inspector",
  description:
    "Step through an agent's Thought→Action→Observation loop, restructure it by architecture, then inject the four failures that break agents in production, and watch detection and recovery fire.",
};

export default function Page() {
  return <LoopInspector />;
}
