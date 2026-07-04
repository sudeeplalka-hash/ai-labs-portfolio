import { splitSentences } from "./textUtils";

// Detect and filter boilerplate (repeated headers/footers, copyright lines, page
// markers) so it never pollutes answers or dominates retrieval. Works for any
// document type — policies, case studies, reports, manuals, etc.

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

const BOILERPLATE_PATTERNS: RegExp[] = [
  /authorized for use only/i,
  /for the exclusive use of/i,
  /copyright|all rights reserved|©|\(c\)\s*\d{4}/i,
  /may not be (transmitted|reproduced|copied|digitized)|photocopied|redistribut/i,
  /reproduction (of this|rights)/i,
  /permission of the copyright/i,
  /to order copies|request permission to reproduce/i,
  /\bpage\s+\d+\b/i,
  /ivey publishing|ivey business school|harvard business|\bhbr\b|business school foundation/i,
  /version:\s*\d{4}-\d{2}-\d{2}/i,
  /^\s*[\d.\s]+\s*$/, // lines that are just numbers / page markers
];

// Sentences that appear two or more times across the document are treated as
// repeated boilerplate (the classic per-page footer pattern).
export function buildBoilerplateSet(texts: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const s of splitSentences(t)) {
      const k = normKey(s);
      if (k.length < 12) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  const set = new Set<string>();
  for (const [k, n] of counts) if (n >= 2) set.add(k);
  return set;
}

export function isBoilerplate(sentence: string, repeated?: Set<string>): boolean {
  const s = sentence.trim();
  if (repeated && repeated.has(normKey(s))) return true;
  return BOILERPLATE_PATTERNS.some((re) => re.test(s));
}

// Share of a chunk's sentences that are boilerplate (0-1).
export function boilerplateRatio(text: string, repeated?: Set<string>): number {
  const sents = splitSentences(text);
  if (!sents.length) return 0;
  const b = sents.filter((s) => isBoilerplate(s, repeated)).length;
  return b / sents.length;
}
