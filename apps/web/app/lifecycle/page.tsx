import type { Metadata } from "next";
import { Home } from "@/components/shell/Home";

// Collection 1's overview (formerly at "/"). The parent-frame landing at "/" is
// now the Competency Map; this keeps the lifecycle home reachable and unchanged.
export const metadata: Metadata = {
  title: "Enterprise AI Lifecycle",
  description:
    "Collection 1: walk an enterprise AI initiative end to end. Frame, Data, Build (RAG), AI Ops, Govern, Realize.",
};

export default function LifecyclePage() {
  return <Home />;
}
