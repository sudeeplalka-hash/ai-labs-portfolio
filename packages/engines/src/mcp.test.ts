import { describe, it, expect } from "vitest";
import { diffNames, diffManifests, validateToolDef, manifestWithTool, lifecycleFrames, traceToJson } from "./mcp";

describe("diffNames", () => {
  it("splits names into added / removed / kept", () => {
    const d = diffNames(["a", "b", "c"], ["b", "c", "d"]);
    expect(d.added).toEqual(["d"]);
    expect(d.removed).toEqual(["a"]);
    expect(d.kept).toEqual(["b", "c"]);
  });
  it("treats empty sides as all-added / all-removed", () => {
    expect(diffNames([], ["x"]).added).toEqual(["x"]);
    expect(diffNames(["x"], []).removed).toEqual(["x"]);
    expect(diffNames([], []).kept).toEqual([]);
  });
});

describe("diffManifests", () => {
  const A = { tools: [{ name: "t1" }, { name: "t2" }], resources: [{ name: "r1" }], prompts: [{ name: "p1" }] };
  const B = { tools: [{ name: "t2" }, { name: "t3" }], resources: [{ name: "r1" }, { name: "r2" }], prompts: [] };

  it("reports per-category changes and a changed flag", () => {
    const d = diffManifests(A, B);
    expect(d.tools).toEqual({ added: ["t3"], removed: ["t1"], kept: ["t2"] });
    expect(d.resources.added).toEqual(["r2"]);
    expect(d.resources.kept).toEqual(["r1"]);
    expect(d.prompts.removed).toEqual(["p1"]);
    expect(d.changed).toBe(true);
  });

  it("changed is false when the two surfaces are identical", () => {
    expect(diffManifests(A, A).changed).toBe(false);
  });
});

describe("validateToolDef", () => {
  it("accepts a well-formed tool and normalizes it", () => {
    const v = validateToolDef({ name: "lookup_dispute", args: [{ name: "case_id", type: "string", required: true }] });
    expect(v.ok).toBe(true);
    expect(v.def!.name).toBe("lookup_dispute");
    expect(v.def!.description).toBe("Custom tool lookup_dispute"); // default description
    expect(v.def!.args[0]).toMatchObject({ name: "case_id", type: "string", required: true });
    expect(v.def!.args[0].enumVals).toBeUndefined(); // dropped for non-enum
  });

  it("rejects a missing or non-snake_case name", () => {
    expect(validateToolDef({ name: "", args: [{ name: "x", type: "string" }] }).ok).toBe(false);
    expect(validateToolDef({ name: "LookUp", args: [{ name: "x", type: "string" }] }).errors.join(" ")).toMatch(/snake_case/);
  });

  it("rejects a name that already exists on the server", () => {
    const v = validateToolDef({ name: "search", args: [{ name: "q", type: "string" }] }, ["search", "get"]);
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/already exists/);
  });

  it("requires at least one argument and flags duplicates", () => {
    expect(validateToolDef({ name: "t", args: [] }).errors.join(" ")).toMatch(/at least one argument/);
    const dup = validateToolDef({ name: "t", args: [{ name: "a", type: "string" }, { name: "a", type: "number" }] });
    expect(dup.errors.join(" ")).toMatch(/Duplicate argument/);
  });

  it("requires enum arguments to carry values", () => {
    const v = validateToolDef({ name: "t", args: [{ name: "mode", type: "enum" }] });
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/needs at least one value/);
    expect(validateToolDef({ name: "t", args: [{ name: "mode", type: "enum", enumVals: ["a", "b"] }] }).ok).toBe(true);
  });
});

describe("manifestWithTool", () => {
  it("appends a new tool and dedupes by name", () => {
    const tools = [{ name: "a" }, { name: "b" }];
    expect(manifestWithTool(tools, { name: "c" }).map((t) => t.name)).toEqual(["a", "b", "c"]);
    expect(manifestWithTool(tools, { name: "a" })).toBe(tools); // no-op returns the same list
  });
});

describe("lifecycleFrames", () => {
  const server = { name: "Disputes", tools: ["lookup", "resolve"], resources: ["r1"], prompts: ["p1"] };

  it("emits the ordered handshake: initialize, result, initialized, tools/list round-trip", () => {
    const f = lifecycleFrames(server);
    expect(f.map((x) => x.seq)).toEqual([1, 2, 3, 4, 5]);
    expect(f[0].method).toBe("initialize");
    expect(f[2].method).toBe("notifications/initialized");
    expect(f[3].method).toBe("tools/list");
  });

  it("negotiates a protocol version and echoes it back on the server result", () => {
    const f = lifecycleFrames({ ...server, protocolVersion: "2025-06-18" });
    const init = f[0].body as { params: { protocolVersion: string } };
    const res = f[1].body as { result: { protocolVersion: string; serverInfo: { name: string } } };
    expect(init.params.protocolVersion).toBe("2025-06-18");
    expect(res.result.protocolVersion).toBe("2025-06-18");
    expect(res.result.serverInfo.name).toBe("Disputes");
  });

  it("marks the initialized frame as a notification (no id)", () => {
    const f = lifecycleFrames(server);
    expect(f[2].kind).toBe("notification");
    expect(f[2].body).not.toHaveProperty("id");
  });

  it("lists the live tools in the tools/list result (reflects added tools)", () => {
    const res = lifecycleFrames(server).find((x) => x.seq === 5)!.body as { result: { tools: { name: string }[] } };
    expect(res.result.tools.map((t) => t.name)).toEqual(["lookup", "resolve"]);
  });

  it("is deterministic", () => {
    expect(lifecycleFrames(server)).toEqual(lifecycleFrames(server));
  });
});

describe("traceToJson", () => {
  const call = {
    tool: "lookup_dispute", sysLabel: "Disputes API", error: false, ms: 47, bytes: 312,
    frames: [
      { dir: "req", note: "request", body: { jsonrpc: "2.0", id: 1, method: "tools/call" } },
      { dir: "res", note: "response", error: false, body: { jsonrpc: "2.0", id: 1, result: {} } },
    ],
  };

  it("normalizes a call into a self-describing trace", () => {
    const t = traceToJson(call);
    expect(t).toMatchObject({ tool: "lookup_dispute", system: "Disputes API", ok: true, latencyMs: 47, bytes: 312 });
    expect(t.frames).toHaveLength(2);
    expect(t.frames[0].dir).toBe("req");
  });

  it("maps error state to ok=false and defaults frame.error", () => {
    const t = traceToJson({ ...call, error: true });
    expect(t.ok).toBe(false);
    expect(t.frames[0].error).toBe(false); // defaulted when absent
  });

  it("preserves the frame bodies verbatim", () => {
    const t = traceToJson(call);
    expect(t.frames[0].body).toEqual({ jsonrpc: "2.0", id: 1, method: "tools/call" });
  });
});
