import { describe, it, expect } from "vitest";
import { pushRecent, type RecentEntry } from "./recent";

const e = (cfg: string, at = 0): RecentEntry => ({ cfg, label: cfg, at });

describe("pushRecent", () => {
  it("prepends the newest entry", () => {
    const list = pushRecent([e("a"), e("b")], e("c"));
    expect(list.map((x) => x.cfg)).toEqual(["c", "a", "b"]);
  });

  it("dedupes by cfg, moving a repeat to the front", () => {
    const list = pushRecent([e("a"), e("b"), e("c")], e("b", 99));
    expect(list.map((x) => x.cfg)).toEqual(["b", "a", "c"]);
    expect(list[0].at).toBe(99); // the new copy wins
    expect(list.filter((x) => x.cfg === "b")).toHaveLength(1);
  });

  it("caps the list to max, dropping the oldest", () => {
    const start = [e("a"), e("b"), e("c")];
    const list = pushRecent(start, e("d"), 3);
    expect(list.map((x) => x.cfg)).toEqual(["d", "a", "b"]);
  });

  it("does not mutate the input list", () => {
    const start = [e("a"), e("b")];
    pushRecent(start, e("c"));
    expect(start.map((x) => x.cfg)).toEqual(["a", "b"]);
  });
});
