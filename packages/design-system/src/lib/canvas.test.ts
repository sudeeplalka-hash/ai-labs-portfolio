import { describe, expect, it, vi } from "vitest";
import { requireCanvas2D } from "./canvas";

describe("optional canvas recovery boundary", () => {
  it("signals a missing context instead of silently treating a blank graphic as loaded", () => {
    const canvas = { getContext: () => null } as Pick<HTMLCanvasElement, "getContext">;
    expect(() => requireCanvas2D(canvas)).toThrow("Canvas rendering is unavailable");
  });
  it("lets blocked context acquisition reach the same caller recovery path", () => {
    const error = new Error("Canvas blocked");
    const canvas = { getContext: () => { throw error; } } as Pick<HTMLCanvasElement, "getContext">;
    expect(() => requireCanvas2D(canvas)).toThrow(error);
  });
  it("retains a working context and requests only the intended renderer", () => {
    const context = {} as CanvasRenderingContext2D;
    const getContext = vi.fn(() => context);
    expect(requireCanvas2D({ getContext } as unknown as HTMLCanvasElement)).toBe(context);
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith("2d");
  });
});
