import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { Home } from "@/components/shell/Home";

// Collection 1's overview (formerly at "/"). The parent-frame landing at "/" is
// now the Competency Map; this keeps the lifecycle home reachable and unchanged.
export const metadata: Metadata = {
  ...routeMetadata("Enterprise AI Lifecycle", "Inspect enterprise ai lifecycle through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/lifecycle"),
  title: "Enterprise AI Lifecycle",
  description:
    "Collection 1: walk an enterprise AI initiative end to end. Frame, Data, Build (RAG), AI Ops, Govern, Realize.",
};

export default function LifecyclePage() {
  return <Home />;
}
