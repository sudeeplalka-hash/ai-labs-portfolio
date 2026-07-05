import { describe, it, expect } from "vitest";
import { sortBy, nextSort } from "./table";

describe("sortBy", () => {
  const rows = [{ id: "a", n: 3 }, { id: "b", n: 1 }, { id: "c", n: 2 }];

  it("sorts ascending and descending by a numeric accessor", () => {
    expect(sortBy(rows, (r) => r.n, "asc").map((r) => r.id)).toEqual(["b", "c", "a"]);
    expect(sortBy(rows, (r) => r.n, "desc").map((r) => r.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by a string accessor", () => {
    expect(sortBy(rows, (r) => r.id, "desc").map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("is stable — equal keys keep their original order", () => {
    const tied = [{ id: "x", n: 1 }, { id: "y", n: 1 }, { id: "z", n: 1 }];
    expect(sortBy(tied, (r) => r.n, "asc").map((r) => r.id)).toEqual(["x", "y", "z"]);
    expect(sortBy(tied, (r) => r.n, "desc").map((r) => r.id)).toEqual(["x", "y", "z"]);
  });

  it("does not mutate the input array", () => {
    const original = [...rows];
    sortBy(rows, (r) => r.n, "asc");
    expect(rows).toEqual(original);
  });
});

describe("nextSort", () => {
  it("starts a new column descending", () => {
    expect(nextSort(null, "value")).toEqual({ key: "value", dir: "desc" });
    expect(nextSort({ key: "name", dir: "asc" }, "value")).toEqual({ key: "value", dir: "desc" });
  });
  it("flips direction on the active column", () => {
    expect(nextSort({ key: "value", dir: "desc" }, "value")).toEqual({ key: "value", dir: "asc" });
    expect(nextSort({ key: "value", dir: "asc" }, "value")).toEqual({ key: "value", dir: "desc" });
  });
});
