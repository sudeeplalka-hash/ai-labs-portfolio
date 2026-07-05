import { describe, it, expect } from "vitest";
import { diffNames, diffManifests } from "./mcp";

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
