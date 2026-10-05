import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { DeployStage } from "@/components/stages/DeployStage";

export const metadata: Metadata = {
  ...routeMetadata("Deploy \u00b7 AI Ops", "Inspect deploy \u00b7 ai ops through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/deploy"), title: "Deploy · AI Ops" };

export default function Page() {
  return <DeployStage />;
}
