import type { Metadata } from "next";
import { CostSimulator } from "@/components/agents/CostSimulator";

export const metadata: Metadata = {
  title: "GAP-06 · Prompt Cost & Token Simulator",
  description:
    "Type a prompt, set the volume, and watch monthly and annual cost at current published pricing, then see caching and batching bend the curve. Unit economics before architecture.",
};

export default function Page() {
  return <CostSimulator />;
}
