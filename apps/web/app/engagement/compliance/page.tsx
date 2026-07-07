import type { Metadata } from "next";
import { ComplianceNavigator } from "@/components/engagement/ComplianceNavigator";

export const metadata: Metadata = {
  title: "EL-05 · AI Compliance Readiness Navigator",
  description:
    "Describe an AI initiative and get its EU AI Act risk tier, the controls that tier requires, your readiness against them, and an audit readiness checklist. Compliance is a design input, not an end gate.",
};

export default function Page() {
  return <ComplianceNavigator />;
}
