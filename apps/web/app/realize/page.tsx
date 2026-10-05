import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { RealizeStage } from "@/components/stages/RealizeStage";

export const metadata: Metadata = {
  ...routeMetadata("Realize \u00b7 Business Outcome", "Inspect realize \u00b7 business outcome through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/realize"), title: "Realize · Business Outcome" };

export default function Page() {
  return <RealizeStage />;
}
