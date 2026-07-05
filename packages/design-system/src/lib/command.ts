// Command palette model. `filterCommands` is a small, dependency-free fuzzy ranker
// used by the ⌘K palette; kept pure so the ordering is unit-tested rather than
// eyeballed.

export interface Command {
  id: string;
  label: string;
  /** Short right-aligned tag, e.g. the collection or "action". */
  group?: string;
  /** Extra text to match against (synonyms, ids) without showing it. */
  keywords?: string;
  run: () => void;
}

function isSubsequence(needle: string, hay: string): boolean {
  let j = 0;
  for (let k = 0; k < hay.length && j < needle.length; k++) {
    if (hay[k] === needle[j]) j++;
  }
  return j === needle.length;
}

/** Rank commands for a query. Empty query keeps the original order. Scoring, high→low:
 *  label prefix > label substring > haystack (label+keywords+group) substring >
 *  subsequence. Non-matches drop out; ties keep original order (stable). Pure. */
export function filterCommands(query: string, commands: Command[]): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands.slice();
  const scored: { c: Command; score: number; i: number }[] = [];
  commands.forEach((c, i) => {
    const label = c.label.toLowerCase();
    const hay = `${label} ${(c.keywords ?? "").toLowerCase()} ${(c.group ?? "").toLowerCase()}`;
    let score = 0;
    if (label.startsWith(q)) score = 100;
    else if (label.includes(q)) score = 70;
    else if (hay.includes(q)) score = 45;
    else if (isSubsequence(q, hay)) score = 20;
    if (score > 0) scored.push({ c, score, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.map((s) => s.c);
}
