import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { StructuredOutput } from "@/components/agents/StructuredOutput";

export const metadata: Metadata = {
  ...routeMetadata("GAP-04 \u00b7 Structured Output Reliability Gate", "Inspect gap-04 \u00b7 structured output reliability gate through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/structured-output"),
  title: "GAP-04 · Structured Output Reliability Gate",
  description:
    "Turn messy text into schema validated JSON, and watch a hard case fail validation, retry with a correction, and pass, the reliability gate that stands between a model and a system of record.",
};

export default function Page() {
  return <StructuredOutput />;
}
