import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { StrategyPlanningView } from "@labs/lab-framing";

export const metadata: Metadata = {
  ...routeMetadata("Strategy & Planning", "Inspect strategy & planning through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/frame"), title: "Strategy & Planning" };

export default function Page() {
  return <StrategyPlanningView />;
}
