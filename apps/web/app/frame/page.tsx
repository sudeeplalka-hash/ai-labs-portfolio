import type { Metadata } from "next";
import { StrategyPlanningView } from "@labs/lab-framing";

export const metadata: Metadata = { title: "Strategy & Planning" };

export default function Page() {
  return <StrategyPlanningView />;
}
