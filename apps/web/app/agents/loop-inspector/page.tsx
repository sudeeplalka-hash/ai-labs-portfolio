import type { Metadata } from "next";
import { LoopInspector } from "@/components/agents/LoopInspector";

export const metadata: Metadata = {
  title: "GAP-02 · Agent Failure and Recovery Inspector",
  description:
    "Step through an agent's Thought→Action→Observation loop, restructure it by architecture, then inject the four failures that break agents in production, and watch detection and recovery fire.",
};

export default function Page() {
  return <LoopInspector />;
}
