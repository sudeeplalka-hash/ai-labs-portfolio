import { describe, it, expect } from "vitest";
import { STORY_SPINE, STORY_MAP, storyNeighbors, storyProgress } from "./story";
import { blankState, demoState } from "./store";
import type { StageKey } from "./types";

const ORDER: StageKey[] = ["frame", "data", "build", "deploy", "govern", "realize", "operate"];

describe("story spine", () => {
  it("has one beat per stage, in order", () => {
    expect(STORY_SPINE.map((b) => b.key)).toEqual(ORDER);
  });

  it("every beat has a question, decision, and both connectors", () => {
    for (const b of STORY_SPINE) {
      expect(b.question.length).toBeGreaterThan(0);
      expect(b.decision.length).toBeGreaterThan(0);
      expect(b.inFrom.length).toBeGreaterThan(0);
      expect(b.outTo.length).toBeGreaterThan(0);
    }
  });

  it("reads headlines without throwing on an empty state", () => {
    const s = blankState();
    for (const b of STORY_SPINE) {
      const heads = b.read(s);
      expect(Array.isArray(heads)).toBe(true);
      expect(heads.length).toBeGreaterThan(0);
      expect(typeof b.soWhat(s)).toBe("string");
    }
  });

  it("a blank state is mostly not-done; a demo state advances the story", () => {
    const blank = storyProgress(blankState());
    const demo = storyProgress(demoState());
    expect(blank.total).toBe(7);
    expect(demo.done).toBeGreaterThan(blank.done);
  });

  it("neighbors thread correctly end to end", () => {
    expect(storyNeighbors("frame").prev).toBeNull();
    expect(storyNeighbors("frame").next?.key).toBe("data");
    expect(storyNeighbors("realize").next?.key).toBe("operate");
    expect(storyNeighbors("operate").next).toBeNull();
    expect(storyNeighbors("deploy").prev?.key).toBe("build");
  });

  it("STORY_MAP resolves each stage", () => {
    for (const k of ORDER) expect(STORY_MAP[k].key).toBe(k);
  });
});
