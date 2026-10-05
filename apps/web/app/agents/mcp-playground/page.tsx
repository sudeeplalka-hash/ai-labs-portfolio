import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { McpPlayground } from "@/components/agents/McpPlayground";

export const metadata: Metadata = {
  ...routeMetadata("GAP-01 \u00b7 MCP Server Contract Workbench", "Inspect gap-01 \u00b7 mcp server contract workbench through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/agents/mcp-playground"),
  title: "GAP-01 · MCP Server Contract Workbench",
  description:
    "Pick a mock enterprise system, watch its MCP server manifest generate (tools, resources, prompts), then compose a tool call and read the full annotated JSON RPC round trip, including how bad arguments get rejected.",
};

export default function Page() {
  return <McpPlayground />;
}
