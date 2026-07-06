import type { Metadata } from "next";
import { ProtocolSelection } from "@/components/agents/ProtocolSelection";

export const metadata: Metadata = {
  title: "GAP-07 · Protocol Selection Lab",
  description:
    "Answer six questions about an integration scenario and get a recommendation across function calling, MCP, A2A, and hybrid, with the rationale, the runner-up, and the condition that flips the call.",
};

export default function Page() {
  return <ProtocolSelection />;
}
