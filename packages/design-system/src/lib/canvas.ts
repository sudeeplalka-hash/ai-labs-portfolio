/** Optional graphics must enter a visible recovery path when no 2D context exists. */
export function requireCanvas2D(canvas: Pick<HTMLCanvasElement, "getContext">): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
  return context;
}
