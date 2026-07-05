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

// Sensitivity — the judgment layer. For each question, the first alternative answer
// (in option order) that changes the primary recommendation: i.e. the single change
// that would flip the call. Returns one flip per question that has one; an empty
// array means the call is robust (no single answer flips it). `primaryOf` is supplied
// by the caller so the exact scored model the UI shows — including any user weights —
// is the one probed, rather than a second copy that could drift.
export interface SensitivityQuestion {
  key: string;
  q: string;
  opts: string[];
}

export interface Flip<K extends string = PKey> {
  key: string;
  q: string;
  to: string;
  newPrimary: K;
}

export function sensitivity<K extends string = PKey>(
  answers: Record<string, number>,
  questions: SensitivityQuestion[],
  primaryOf: (a: Record<string, number>) => K,
): Flip<K>[] {
  const primary = primaryOf(answers);
  return questions
    .map((qu): Flip<K> | null => {
      const cur = answers[qu.key];
      for (let i = 0; i < qu.opts.length; i++) {
        if (i === cur) continue;
        const alt = primaryOf({ ...answers, [qu.key]: i });
        if (alt !== primary) return { key: qu.key, q: qu.q, to: qu.opts[i], newPrimary: alt };
      }
      return null;
    })
    .filter((s): s is Flip<K> => s !== null);
}
