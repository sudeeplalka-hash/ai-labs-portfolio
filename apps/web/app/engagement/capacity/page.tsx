import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { CapacityPlanner } from "@/components/engagement/CapacityPlanner";

export const metadata: Metadata = {
  ...routeMetadata("EL-03 \u00b7 Capacity and Skills Coverage Planner", "Inspect el-03 \u00b7 capacity and skills coverage planner through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/capacity"),
  title: "EL-03 · Capacity and Skills Coverage Planner",
  description:
    "Portfolio demand against a 30 person skill inventory, a utilization heatmap flags where you're over allocated, and hire / contract / upskill toggles move the delivery date and cost live.",
};

export default function Page() {
  return <CapacityPlanner />;
}
