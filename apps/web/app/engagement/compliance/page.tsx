import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { ComplianceNavigator } from "@/components/engagement/ComplianceNavigator";

export const metadata: Metadata = {
  ...routeMetadata("EL-05 \u00b7 AI Compliance Readiness Navigator", "Inspect el-05 \u00b7 ai compliance readiness navigator through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/compliance"),
  title: "EL-05 · AI Compliance Readiness Navigator",
  description:
    "Describe an AI initiative and get its EU AI Act risk tier, the controls that tier requires, your readiness against them, and an audit readiness checklist. Compliance is a design input, not an end gate.",
};

export default function Page() {
  return <ComplianceNavigator />;
}
