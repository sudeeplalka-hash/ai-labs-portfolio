import type { Metadata } from "next";
import { McpPlayground } from "@/components/agents/McpPlayground";

export const metadata: Metadata = {
  title: "GAP-01 · MCP Server Contract Workbench",
  description:
    "Pick a mock enterprise system, watch its MCP server manifest generate (tools, resources, prompts), then compose a tool call and read the full annotated JSON RPC round trip, including how bad arguments get rejected.",
};

export default function Page() {
  return <McpPlayground />;
}
