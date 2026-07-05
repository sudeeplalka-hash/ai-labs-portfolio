import { describe, it, expect } from "vitest";
import { filterCommands, type Command } from "./command";

const cmd = (label: string, extra: Partial<Command> = {}): Command => ({
  id: label, label, run: () => {}, ...extra,
});
const labels = (cs: Command[]) => cs.map((c) => c.label);

describe("filterCommands", () => {
  it("returns all commands in original order for an empty query", () => {
    const list = [cmd("Alpha"), cmd("Beta")];
    expect(labels(filterCommands("   ", list))).toEqual(["Alpha", "Beta"]);
  });

  it("ranks a label prefix above a mere substring match", () => {
    const list = [cmd("Import portfolio"), cmd("Portfolio")];
    expect(labels(filterCommands("port", list))).toEqual(["Portfolio", "Import portfolio"]);
  });

  it("matches against hidden keywords", () => {
    const list = [cmd("Reset", { keywords: "clear defaults" }), cmd("Share")];
    expect(labels(filterCommands("clear", list))).toEqual(["Reset"]);
  });

  it("matches loosely by subsequence", () => {
    expect(filterCommands("ob", [cmd("Orchestration board")])).toHaveLength(1);
  });

  it("drops non-matches", () => {
    expect(filterCommands("zzz", [cmd("Alpha"), cmd("Beta")])).toEqual([]);
  });

  it("keeps original order for equal scores (stable)", () => {
    const list = [cmd("Copy link"), cmd("Copy CSV")];
    expect(labels(filterCommands("copy", list))).toEqual(["Copy link", "Copy CSV"]);
  });
});
