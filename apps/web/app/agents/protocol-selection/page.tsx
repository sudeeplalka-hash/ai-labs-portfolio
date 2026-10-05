import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { ProtocolSelection } from "@/components/agents/ProtocolSelection";

export const metadata: Metadata = {
  ...routeMetadata("GAP-07 \u00b7 Protocol Selection Decision Model", "Inspect gap-07 \u00b7 protocol selection decision model through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/protocol-selection"),
  title: "GAP-07 · Protocol Selection Decision Model",
  description:
    "Answer six questions about an integration scenario and get a recommendation across function calling, MCP, A2A, and hybrid, with the rationale, the runner up, and the condition that flips the call.",
};

export default function Page() {
  return <ProtocolSelection />;
}
