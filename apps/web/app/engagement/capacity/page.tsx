import type { Metadata } from "next";
import { CapacityPlanner } from "@/components/engagement/CapacityPlanner";

export const metadata: Metadata = {
  title: "EL-03 · Capacity & Resourcing Planner",
  description:
    "Portfolio demand against a 30-person skill inventory, a utilization heatmap flags where you're over-allocated, and hire / contract / upskill toggles move the delivery date and cost live.",
};

export default function Page() {
  return <CapacityPlanner />;
}
