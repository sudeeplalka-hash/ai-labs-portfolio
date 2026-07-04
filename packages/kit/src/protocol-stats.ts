// Dated protocol-landscape stats cited on Collection 2 cards. B5.6: protocol stats
// live in a dated data file, never in copy. Refresh quarterly (Phase 5 notes ACP/UCP
// agent-commerce protocols as emerging — add here if the landscape shifts).

export const PROTOCOL_STATS_AS_OF = "2026-07-02";

export interface ProtocolStat {
  key: string;
  label: string;
  value: string;
  note: string;
}

// The 2026 enterprise default is the two-layer stack: MCP for vertical tool access,
// A2A for horizontal agent coordination.
export const PROTOCOL_STATS: ProtocolStat[] = [
  {
    key: "mcp-servers",
    label: "MCP enterprise servers",
    value: "10,000+",
    note: "Vertical tool access; backed by Anthropic, OpenAI, Google, Microsoft, AWS.",
  },
  {
    key: "a2a-orgs",
    label: "A2A participating orgs",
    value: "150+",
    note: "Horizontal agent coordination; Linux Foundation project, in production.",
  },
];

export function protocolStat(key: string): ProtocolStat | undefined {
  return PROTOCOL_STATS.find((s) => s.key === key);
}

// The two axes Collection 2's hero renders: MCP = vertical (tool access),
// A2A = horizontal (agent coordination).
export const PROTOCOL_AXES = {
  vertical: { protocol: "MCP", meaning: "tool access" },
  horizontal: { protocol: "A2A", meaning: "agent coordination" },
} as const;
