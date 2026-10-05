import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { ContextMemory } from "@/components/agents/ContextMemory";

export const metadata: Metadata = {
  ...routeMetadata("GAP-05 \u00b7 Context and Memory Strategy Evaluator", "Inspect gap-05 \u00b7 context and memory strategy evaluator through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/context-memory"),
  title: "GAP-05 · Context and Memory Strategy Evaluator",
  description:
    "One task, four context strategies side by side, full dump, summarize, compress, subagent handoff, compared on cost, fidelity, and failure risk, with a memory view of what survives across turns.",
};

export default function Page() {
  return <ContextMemory />;
}
