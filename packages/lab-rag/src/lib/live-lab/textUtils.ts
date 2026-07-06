// Shared text helpers for the Live RAG Evaluator Lab. All deterministic.

export function estimateTokens(text: string): number {
  // Rough heuristic: ~4 characters per token.
  return Math.max(1, Math.round(text.trim().length / 4));
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "being", "this", "that", "these", "those", "it",
  "as", "at", "by", "from", "into", "about", "what", "when", "where", "which", "who", "how",
  "do", "does", "did", "can", "could", "should", "would", "will", "shall", "may", "might",
  "i", "you", "we", "they", "he", "she", "my", "our", "your", "their", "its", "not", "no",
  "any", "all", "some", "more", "must", "have", "has", "had", "than", "up", "out", "so",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s$%.-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function contentWords(text: string): string[] {
  return tokenize(text).filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function uniqueContentWords(text: string): Set<string> {
  return new Set(contentWords(text));
}

// Extract numbers, currency, and percentages, used to detect ungrounded specifics.
export function extractNumerics(text: string): string[] {
  const matches = text.match(/\$?\d[\d,]*(?:\.\d+)?%?/g) ?? [];
  return matches.map((m) => m.replace(/,/g, "")).filter((m) => m.replace(/[^0-9]/g, "").length > 0);
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Policy / risk vocabulary used for retrieval bonuses and risk detection.
export const POLICY_KEYWORDS = [
  "policy", "limit", "approval", "approve", "require", "required", "reimbursement",
  "exception", "deadline", "review", "compliance", "security", "risk", "threshold",
  "receipt", "data", "vendor", "governance", "confidential", "regulated", "breach",
];

export const HIGH_RISK_TERMS = [
  "legal", "compliance", "termination", "security incident", "breach",
  "financial approval", "reimbursement limit", "exception", "regulated",
  "confidential", "pii", "personal data",
];

// Repair common PDF-extraction artifacts and tidy a sentence for display.
export function cleanSentence(s: string): string {
  return s
    .replace(/\s+/g, " ")
    // footnote/superscript digit wedged between a word and a lowercase word
    .replace(/([a-z)\]]),?\s+\d{1,2}\s+(?=[a-z])/gi, "$1 ")
    // a single isolated consonant split off from its word: "data c ollection"
    .replace(/\b([bcdfghjklmnpqrstvwxyz])\s+([a-z]{2,})/gi, "$1$2")
    // common 2-letter splits: "th e" -> "the", "wh ich" -> handled above
    .replace(/\s+([,.;:%])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}
