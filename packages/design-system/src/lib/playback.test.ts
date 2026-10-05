import { describe, expect, it } from "vitest";
import { clampPlaybackStep, nextPlaybackStep, playbackDelay } from "./playback";
import { chartLabel } from "./chart";

describe("presentation playback boundaries", () => {
  it("stays at the completed outcome and safely handles empty or replaced traces", () => {
    expect(nextPlaybackStep(5, 5)).toBe(5);
    expect(nextPlaybackStep(0, 0)).toBe(0);
    expect(clampPlaybackStep(8, 3)).toBe(3);
    expect(clampPlaybackStep(-2, 3)).toBe(0);
    expect(clampPlaybackStep(Number.NaN, 3)).toBe(0);
  });
  it("changes only presentation delay and rejects pathological speed values", () => {
    expect(playbackDelay(750, 2)).toBe(375);
    expect(playbackDelay(750, 0.5)).toBe(1500);
    expect(playbackDelay(750, 0)).toBe(750);
    expect(playbackDelay(750, Infinity)).toBe(750);
    expect(playbackDelay(750, 100)).toBe(80);
  });
  it("normalizes legacy literal Unicode chart labels without changing normal text", () => {
    expect(chartLabel("high risk \\u2192")).toBe("high risk →");
    expect(chartLabel("Value × risk")).toBe("Value × risk");
  });
});
