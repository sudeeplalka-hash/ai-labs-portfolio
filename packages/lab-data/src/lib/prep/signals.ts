// Corpus content signals (Corpus Intelligence · Phase 0).
// Two new deterministic scores that extend the rulebook categories in Phase 1:
//
//  - contentConcentration: how much of a document is repeated phrasing
//    (boilerplate, templates, copy-paste). Visible math: share of distinct
//    3-grams among all 3-grams; score = round(100 * distinctShare).
//
//  - topicalCohesion: how tightly the corpus holds together topically.
//    Visible math: mean cosine similarity of each document vector to the
//    corpus centroid; score = round(100 * meanCosine). Per-document cosines
//    are returned so outliers can be flagged (Atlas overlay, Phase 3+).
//
// Pure functions, no state, no randomness.

import { dot, l2normalize } from "@labs/kit";

export interface ConcentrationResult {
  /** 0..100 — higher = more distinct content, lower = repetitive/boilerplate. */
  score: number;
  /** 0..1 share of trigram occurrences that repeat an earlier trigram. */
  repeatedShare: number;
  /** Most-repeated trigrams (up to 5), for the finding detail line. */
  topRepeats: string[];
}

export function contentConcentration(tokens: string[]): ConcentrationResult {
  if (tokens.length < 3) return { score: 100, repeatedShare: 0, topRepeats: [] };
  const counts = new Map<string, number>();
  const total = tokens.length - 2;
  for (let i = 0; i < total; i++) {
    const g = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const distinct = counts.size;
  const repeatedShare = (total - distinct) / total;
  const topRepeats = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([g]) => g);
  return { score: Math.round(100 * (1 - repeatedShare)), repeatedShare, topRepeats };
}

export interface CohesionResult {
  /** 0..100 — higher = documents share a topical center. */
  score: number;
  /** Cosine of each document vector to the corpus centroid (input order). */
  perDoc: number[];
}

export function topicalCohesion(vectors: number[][]): CohesionResult {
  if (vectors.length === 0) return { score: 100, perDoc: [] };
  if (vectors.length === 1) return { score: 100, perDoc: [1] };
  const d = vectors[0].length;
  if (d === 0) return { score: 100, perDoc: vectors.map(() => 1) };
  const unit = vectors.map(l2normalize);
  const centroid = new Array(d).fill(0);
  for (const v of unit) for (let j = 0; j < d; j++) centroid[j] += v[j];
  const c = l2normalize(centroid);
  const perDoc = unit.map((v) => Math.max(0, Math.min(1, dot(v, c))));
  const mean = perDoc.reduce((a, b) => a + b, 0) / perDoc.length;
  return { score: Math.round(100 * mean), perDoc };
}

// ---------------------------------------------------------------------------
// Parsability profile (Phase 4 · F-5). Real, per-file extraction diagnostics:
//  - extractionYield: extracted characters ÷ raw file bytes. Binary formats
//    (PDF/DOCX) that yield almost no text are image-heavy or scanned, the
//    classic "hard for an LLM" document.
//  - replacementShare: U+FFFD replacement characters ÷ characters (mangled
//    encoding survives extraction as �).
//  - boilerplateLineShare: share of non-trivial lines that repeat verbatim
//    (headers/footers/templates surviving extraction).
// All measured on the visitor's own file, nothing modeled.
// ---------------------------------------------------------------------------

export interface ParsabilityResult {
  extractionYield: number;    // 0..1 (capped)
  replacementShare: number;   // 0..1
  boilerplateLineShare: number; // 0..1
  level: "healthy" | "watch" | "risk" | "critical";
  reasons: string[];
}

export function parsabilityProfile(text: string, rawBytes: number): ParsabilityResult {
  const chars = text.length;
  const extractionYield = rawBytes > 0 ? Math.min(1, chars / rawBytes) : 1;

  let replacements = 0;
  for (const ch of text) if (ch === "\uFFFD") replacements++;
  const replacementShare = chars > 0 ? replacements / chars : 0;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length >= 12);
  const seen = new Map<string, number>();
  for (const l of lines) seen.set(l, (seen.get(l) ?? 0) + 1);
  let repeated = 0;
  for (const n of seen.values()) if (n > 1) repeated += n - 1;
  const boilerplateLineShare = lines.length > 0 ? repeated / lines.length : 0;

  const reasons: string[] = [];
  let level: ParsabilityResult["level"] = "healthy";
  const bump = (l: ParsabilityResult["level"]) => {
    const rank = { healthy: 0, watch: 1, risk: 2, critical: 3 };
    if (rank[l] > rank[level]) level = l;
  };

  if (rawBytes > 20_000 && extractionYield < 0.02) {
    bump("critical");
    reasons.push(`Extraction yielded ${(extractionYield * 100).toFixed(1)}% of the file's bytes as text, likely scanned or image-heavy; an LLM sees almost nothing of this document.`);
  } else if (rawBytes > 20_000 && extractionYield < 0.08) {
    bump("risk");
    reasons.push(`Low extraction yield (${(extractionYield * 100).toFixed(1)}%), much of this file (tables, figures, scans) doesn't survive as text.`);
  }
  if (replacementShare > 0.005) {
    bump("risk");
    reasons.push(`${(replacementShare * 100).toFixed(2)}% of characters are encoding replacements (\u{FFFD}), mangled text degrades retrieval and answers.`);
  } else if (replacementShare > 0.001) {
    bump("watch");
    reasons.push("Scattered encoding replacement characters detected.");
  }
  if (boilerplateLineShare > 0.3) {
    bump("risk");
    reasons.push(`${Math.round(boilerplateLineShare * 100)}% of lines repeat verbatim, headers/footers or template scaffolding survived extraction.`);
  } else if (boilerplateLineShare > 0.15) {
    bump("watch");
    reasons.push(`${Math.round(boilerplateLineShare * 100)}% of lines repeat verbatim.`);
  }

  return { extractionYield, replacementShare, boilerplateLineShare, level, reasons };
}

// ---------------------------------------------------------------------------
// Language profile (Phase 4 · F-6). Deterministic HEURISTIC, and labeled as
// such wherever it renders: Unicode-script shares first, then a stopword vote
// among Latin-script languages. Good enough to flag "this corpus mixes
// languages the target model setup may not expect", not a linguistic claim.
// ---------------------------------------------------------------------------

export interface LanguageProfileResult {
  /** e.g. "English", "Spanish", "CJK script", "Cyrillic script", "Unknown" */
  primary: string;
  confidence: "high" | "low";
  /** Script mix by character share (letters only). */
  scriptMix: { script: string; share: number }[];
}

const SCRIPTS: { script: string; re: RegExp }[] = [
  { script: "Latin", re: /[A-Za-z\u00C0-\u024F]/ },
  { script: "Cyrillic", re: /[\u0400-\u04FF]/ },
  { script: "CJK", re: /[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/ },
  { script: "Arabic", re: /[\u0600-\u06FF]/ },
  { script: "Devanagari", re: /[\u0900-\u097F]/ },
  { script: "Greek", re: /[\u0370-\u03FF]/ },
];

const LATIN_STOPWORDS: Record<string, string[]> = {
  English: ["the", "and", "of", "to", "in", "is", "that", "for", "with", "are"],
  Spanish: ["el", "la", "de", "que", "los", "las", "una", "por", "con", "para"],
  French: ["le", "la", "les", "des", "est", "dans", "que", "pour", "une", "avec"],
  German: ["der", "die", "das", "und", "ist", "nicht", "mit", "ein", "eine", "für"],
  Portuguese: ["de", "que", "não", "uma", "para", "com", "os", "as", "mais", "por"],
  Dutch: ["de", "het", "een", "van", "en", "dat", "niet", "voor", "met", "zijn"],
};

export function languageProfile(text: string): LanguageProfileResult {
  const counts = new Map<string, number>();
  let letters = 0;
  for (const ch of text) {
    for (const { script, re } of SCRIPTS) {
      if (re.test(ch)) {
        counts.set(script, (counts.get(script) ?? 0) + 1);
        letters++;
        break;
      }
    }
  }
  if (letters === 0) return { primary: "Unknown", confidence: "low", scriptMix: [] };

  const scriptMix = [...counts.entries()]
    .map(([script, n]) => ({ script, share: n / letters }))
    .sort((a, b) => b.share - a.share);
  const top = scriptMix[0];

  if (top.script !== "Latin") {
    return { primary: `${top.script} script`, confidence: top.share > 0.7 ? "high" : "low", scriptMix };
  }

  // Latin: stopword vote.
  const words = (text.toLowerCase().match(/[a-zà-öø-ÿ]{2,}/g) ?? []).slice(0, 4000);
  const wordSetCounts = new Map<string, number>();
  for (const w of words) wordSetCounts.set(w, (wordSetCounts.get(w) ?? 0) + 1);
  let bestLang = "English";
  let bestScore = 0;
  let secondScore = 0;
  for (const [lang, stops] of Object.entries(LATIN_STOPWORDS)) {
    let score = 0;
    for (const st of stops) score += wordSetCounts.get(st) ?? 0;
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestLang = lang;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }
  const confident = bestScore >= 5 && bestScore >= secondScore * 1.6;
  return { primary: bestScore === 0 ? "Latin script" : bestLang, confidence: confident ? "high" : "low", scriptMix };
}
