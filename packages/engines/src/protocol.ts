// Protocol selection engine (GAP-07 · Protocol Selection Lab).
// Six 0..2 answers → weighted scores for function-calling / MCP / A2A / hybrid,
// with the primary recommendation and the runner-up (the flip candidate).

export type PKey = "fc" | "mcp" | "a2a" | "hybrid";

export function evaluate(a: Record<string, number>): { scores: Record<PKey, number>; primary: PKey; runnerUp: PKey } {
  const { q1, q2, q3, q4, q5, q6 } = a;
  const mcp = q1 * 1.6 + q2 * 1.1 + q4 * 1.0 + q5 * 1.1;
  const a2a = q3 * 2.4 + q2 * 0.8;
  const fc = (2 - q1) * 1.7 + (2 - q3) * 1.6 + (q2 === 0 ? 1.5 : 0) + (q6 === 0 ? 1.0 : 0);
  const hybrid = Math.min(mcp, a2a) * 1.15 + q4 * 0.7;
  const scores: Record<PKey, number> = { fc, mcp, a2a, hybrid };
  const ranked = (Object.entries(scores) as [PKey, number][]).sort((x, y) => y[1] - x[1]);
  return { scores, primary: ranked[0][0], runnerUp: ranked[1][0] };
}
