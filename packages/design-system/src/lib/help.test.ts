import { afterEach, describe, expect, it, vi } from "vitest";
import { createHelpDismissal } from "./help";

afterEach(() => vi.useRealTimers());

describe("metric help focus ownership", () => {
  it("keeps help open on pointer exit while its trigger retains keyboard focus", () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const help = createHelpDismissal(() => true, close);
    help.schedule(); vi.advanceTimersByTime(500);
    expect(close).not.toHaveBeenCalled();
  });
  it("rechecks focus after it moves from the trigger into the scrolling help", () => {
    vi.useFakeTimers();
    let focus: "trigger" | "help" | "outside" = "outside";
    const close = vi.fn();
    const help = createHelpDismissal(() => focus !== "outside", close);
    help.schedule();
    focus = "help"; vi.advanceTimersByTime(200);
    expect(close).not.toHaveBeenCalled();
    focus = "outside"; help.schedule(); vi.advanceTimersByTime(200);
    expect(close).toHaveBeenCalledTimes(1);
  });
  it("cancels stale dismissal when help is reentered or unmounted", () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const help = createHelpDismissal(() => false, close);
    help.schedule(); vi.advanceTimersByTime(100); help.cancel();
    vi.advanceTimersByTime(500);
    expect(close).not.toHaveBeenCalled();
    help.schedule(); help.schedule(); vi.advanceTimersByTime(200);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
