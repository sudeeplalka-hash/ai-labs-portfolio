import type { Metadata } from "next";
import { StructuredOutput } from "@/components/agents/StructuredOutput";

export const metadata: Metadata = {
  title: "GAP-04 · Tool-Use & Structured Output",
  description:
    "Turn messy text into schema-validated JSON, and watch a hard case fail validation, retry with a correction, and pass — the reliability gate that stands between a model and a system of record.",
};

export default function Page() {
  return <StructuredOutput />;
}
