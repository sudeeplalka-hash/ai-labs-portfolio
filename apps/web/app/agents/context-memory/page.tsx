import type { Metadata } from "next";
import { ContextMemory } from "@/components/agents/ContextMemory";

export const metadata: Metadata = {
  title: "GAP-05 · Context and Memory Strategy Evaluator",
  description:
    "One task, four context strategies side by side, full dump, summarize, compress, subagent handoff, compared on cost, fidelity, and failure risk, with a memory view of what survives across turns.",
};

export default function Page() {
  return <ContextMemory />;
}
