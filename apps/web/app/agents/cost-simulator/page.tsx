import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { CostSimulator } from "@/components/agents/CostSimulator";

export const metadata: Metadata = {
  ...routeMetadata("GAP-06 \u00b7 Token Economics Simulator", "Inspect gap-06 \u00b7 token economics simulator through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/cost-simulator"),
  title: "GAP-06 · Token Economics Simulator",
  description:
    "Type a prompt, set the volume, and watch monthly and annual cost at current published pricing, then see caching and batching bend the curve. Unit economics before architecture.",
};

export default function Page() {
  return <CostSimulator />;
}
