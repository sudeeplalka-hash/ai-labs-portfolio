// MCP manifest diff — what changed between two servers' capability surfaces. Pure:
// compares tool / resource / prompt names and reports added / removed / kept per
// category, plus a `changed` flag. Drives the Playground's "on system switch" diff.

export interface NameDiff {
  added: string[];
  removed: string[];
  kept: string[];
}

export function diffNames(from: string[], to: string[]): NameDiff {
  const fromSet = new Set(from);
  const toSet = new Set(to);
  return {
    added: to.filter((n) => !fromSet.has(n)),
    removed: from.filter((n) => !toSet.has(n)),
    kept: to.filter((n) => fromSet.has(n)),
  };
}

export interface ManifestShape {
  tools: { name: string }[];
  resources: { name: string }[];
  prompts: { name: string }[];
}

export interface ManifestDiff {
  tools: NameDiff;
  resources: NameDiff;
  prompts: NameDiff;
  /** true when any tool / resource / prompt was added or removed. */
  changed: boolean;
}

export function diffManifests(from: ManifestShape, to: ManifestShape): ManifestDiff {
  const tools = diffNames(from.tools.map((t) => t.name), to.tools.map((t) => t.name));
  const resources = diffNames(from.resources.map((r) => r.name), to.resources.map((r) => r.name));
  const prompts = diffNames(from.prompts.map((p) => p.name), to.prompts.map((p) => p.name));
  const changed =
    tools.added.length + tools.removed.length +
    resources.added.length + resources.removed.length +
    prompts.added.length + prompts.removed.length > 0;
  return { tools, resources, prompts, changed };
}

// Custom tool builder — validate a user-authored tool definition against the MCP shape
// (lower_snake_case unique name, at least one argument, each argument named/typed, enums
// carry values) and normalize it. Returns typed errors the UI surfaces the same way the
// server rejects a bad tools/call. Pure — the component wraps the returned def with a
// deterministic result closure.
export type ToolArgType = "string" | "number" | "enum";
export interface ToolArgDef {
  name: string;
  type: ToolArgType;
  required: boolean;
  example: string;
  enumVals?: string[];
}
export interface ToolDef {
  name: string;
  description: string;
  args: ToolArgDef[];
}
export interface ToolValidation {
  ok: boolean;
  errors: string[];
  def?: ToolDef;
}

const TOOL_NAME_RE = /^[a-z][a-z0-9_]*$/;

export interface RawToolArg { name: string; type: ToolArgType; required?: boolean; example?: string; enumVals?: string[]; }
export interface RawToolDef { name: string; description?: string; args: RawToolArg[]; }

export function validateToolDef(raw: RawToolDef, existingNames: string[] = []): ToolValidation {
  const errors: string[] = [];
  const name = (raw.name ?? "").trim();
  if (!name) errors.push("Tool name is required.");
  else if (!TOOL_NAME_RE.test(name)) errors.push("Name must be lower_snake_case (start with a letter).");
  else if (existingNames.includes(name)) errors.push(`A tool named "${name}" already exists on this server.`);

  const args = raw.args ?? [];
  if (args.length === 0) errors.push("Add at least one argument.");
  const seen = new Set<string>();
  args.forEach((a, i) => {
    const an = (a.name ?? "").trim();
    if (!an) errors.push(`Argument ${i + 1} needs a name.`);
    else if (!TOOL_NAME_RE.test(an)) errors.push(`Argument "${an}" must be lower_snake_case.`);
    else if (seen.has(an)) errors.push(`Duplicate argument "${an}".`);
    else seen.add(an);
    if (a.type === "enum" && (!a.enumVals || a.enumVals.length === 0)) errors.push(`Enum argument "${an || i + 1}" needs at least one value.`);
  });

  if (errors.length) return { ok: false, errors };
  const def: ToolDef = {
    name,
    description: (raw.description ?? "").trim() || `Custom tool ${name}`,
    args: args.map((a) => ({
      name: a.name.trim(),
      type: a.type,
      required: a.required ?? false,
      example: (a.example ?? "").trim(),
      enumVals: a.type === "enum" ? a.enumVals : undefined,
    })),
  };
  return { ok: true, errors: [], def };
}

/** Append a tool to a manifest's tool list, unique by name (no-op if it already exists). */
export function manifestWithTool<T extends { name: string }>(tools: T[], tool: T): T[] {
  return tools.some((t) => t.name === tool.name) ? tools : [...tools, tool];
}

// Session lifecycle — the ordered frames an MCP session opens with, before any tool runs:
// the client's `initialize` (declaring protocol version + capabilities), the server's reply
// (version negotiated, capabilities + identity returned), the client's `initialized`
// notification, then a single `tools/list` discovery round-trip. Built from the live server
// so a custom tool added in the builder shows up in tools/list with no client change — the
// whole point of coding to the contract. Pure; frames are the real JSON-RPC shapes.
export interface LifecycleServer {
  name: string;
  tools: string[];
  resources: string[];
  prompts: string[];
  protocolVersion?: string;
}
export interface LifecycleFrame {
  seq: number;
  dir: "client→server" | "server→client";
  kind: "request" | "response" | "notification";
  method?: string;
  body: object;
  note: string;
}
export function lifecycleFrames(server: LifecycleServer): LifecycleFrame[] {
  const v = server.protocolVersion ?? "2025-06-18";
  return [
    {
      seq: 1, dir: "client→server", kind: "request", method: "initialize",
      body: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: v, capabilities: { tools: {}, resources: {}, prompts: {} }, clientInfo: { name: "ai-labs-playground", version: "1.0.0" } } },
      note: "The client opens the session by declaring the protocol version and the capabilities it supports — nothing tool-specific yet.",
    },
    {
      seq: 2, dir: "server→client", kind: "response",
      body: { jsonrpc: "2.0", id: 1, result: { protocolVersion: v, capabilities: { tools: { listChanged: true }, resources: {}, prompts: {} }, serverInfo: { name: server.name, version: "1.0.0" } } },
      note: "The server replies with the version it agreed to plus its own capabilities and identity. Version is negotiated here, once.",
    },
    {
      seq: 3, dir: "client→server", kind: "notification", method: "notifications/initialized",
      body: { jsonrpc: "2.0", method: "notifications/initialized" },
      note: "The client acknowledges with a notification (no id, no reply). The session is now live.",
    },
    {
      seq: 4, dir: "client→server", kind: "request", method: "tools/list",
      body: { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      note: "Discovery is one call, not N bespoke integrations: the client asks the server what it can do.",
    },
    {
      seq: 5, dir: "server→client", kind: "response",
      body: { jsonrpc: "2.0", id: 2, result: { tools: server.tools.map((name) => ({ name })) } },
      note: `The server returns its ${server.tools.length} tool${server.tools.length === 1 ? "" : "s"} by name. The client codes to this list, so a newly added tool appears here with no client change.`,
    },
  ];
}

// Trace export — normalize a completed call (its request/response frames plus the real
// byte + latency figures) into a clean, self-describing object for copy/download. Pure:
// strips UI-only fields and keeps the wire frames, so a shared trace is exactly what the
// client and server exchanged.
export interface TraceFrame { dir: string; note: string; error?: boolean; body: unknown; }
export interface CallLike { tool: string; sysLabel: string; error: boolean; ms: number; bytes: number; frames: TraceFrame[]; }
export interface ExportedTrace {
  tool: string;
  system: string;
  ok: boolean;
  latencyMs: number;
  bytes: number;
  frames: { dir: string; note: string; error: boolean; body: unknown }[];
}
export function traceToJson(call: CallLike): ExportedTrace {
  return {
    tool: call.tool,
    system: call.sysLabel,
    ok: !call.error,
    latencyMs: call.ms,
    bytes: call.bytes,
    frames: call.frames.map((f) => ({ dir: f.dir, note: f.note, error: f.error ?? false, body: f.body })),
  };
}
