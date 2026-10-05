import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { AdoptionReadiness } from "@/components/engagement/AdoptionReadiness";

export const metadata: Metadata = {
  ...routeMetadata("EL-01 \u00b7 Adoption Readiness Decision Instrument", "Inspect el-01 \u00b7 adoption readiness decision instrument through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/adoption"),
  title: "EL-01 · Adoption Readiness Decision Instrument",
  description:
    "Score six readiness factors for an AI rollout, get a gate verdict, scale, scale with conditions, or hold, and a two week adoption plan that changes as the factors move.",
};

export default function Page() {
  return <AdoptionReadiness />;
}
