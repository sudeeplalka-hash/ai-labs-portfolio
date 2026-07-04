import type { DocumentChunk, LiveLabDocument } from "@rag/types/liveLab";
import { estimateTokens, normalizeWhitespace, splitSentences } from "./textUtils";

export const DEFAULT_CHUNKING_CONFIG = {
  targetChunkSize: 700,
  chunkOverlap: 120,
  minChunkSize: 80,
  preserveHeadings: true,
};

export type ChunkingConfig = typeof DEFAULT_CHUNKING_CONFIG;

interface Section {
  heading?: string;
  body: string;
}

// Heuristic: an ALL-CAPS short line with no terminal punctuation reads as a
// section heading (common in reports, case studies, and SOPs that lack markdown).
function isHeadingLike(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 70) return false;
  const letters = (t.match(/[a-zA-Z]/g) ?? []).length;
  const lower = (t.match(/[a-z]/g) ?? []).length;
  const upper = (t.match(/[A-Z]/g) ?? []).length;
  if (letters < 3) return false;
  if (/[.,;]$/.test(t)) return false;
  if (t.split(/\s+/).length > 10) return false;
  if (/^[A-Z]{1,3}\d+$/.test(t)) return false; // exclude codes like W27977
  if (!(upper / letters > 0.8 && lower <= 2)) return false;
  const words = t.split(/\s+/).length;
  return words >= 2 || t.length >= 10; // avoid single short fragments
}

// Split markdown/plain text into sections by heading. Body keeps its line breaks.
function toSections(text: string, preserveHeadings: boolean): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let heading: string | undefined;
  let buf: string[] = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    if (body || heading) sections.push({ heading, body });
    buf = [];
  };

  for (const line of lines) {
    const h = preserveHeadings ? line.match(/^#{1,6}\s+(.*)$/) : null;
    if (h) {
      flush();
      heading = h[1].trim();
    } else if (preserveHeadings && isHeadingLike(line)) {
      flush();
      heading = line.trim();
    } else {
      buf.push(line);
    }
  }
  flush();

  const filtered = sections.filter((s) => s.body.length > 0);
  return filtered.length ? filtered : [{ heading: undefined, body: text.trim() }];
}

// Carry the last `overlap` characters (snapped to a word boundary) into the next chunk.
function wordOverlapTail(text: string, overlap: number): string {
  if (overlap <= 0 || text.length <= overlap) return overlap > 0 ? "" : "";
  const slice = text.slice(text.length - overlap);
  const sp = slice.indexOf(" ");
  return sp > 0 ? slice.slice(sp + 1) : slice;
}

// Hard-split an oversized unit on word boundaries.
function hardSplit(unit: string, max: number): string[] {
  const out: string[] = [];
  let rest = unit.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf(" ", max);
    if (cut < max * 0.5) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

// Pack a body of text into chunks by greedily accumulating sentences up to the
// target size, with character overlap between consecutive chunks. Works whether
// or not the text has blank-line paragraph separators.
function packBody(body: string, config: ChunkingConfig): string[] {
  const sentences = splitSentences(body);
  const units: string[] = [];
  for (const s of sentences) {
    if (s.length <= config.targetChunkSize) units.push(s);
    else units.push(...hardSplit(s, config.targetChunkSize));
  }
  if (units.length === 0) {
    const t = body.trim();
    return t ? [t] : [];
  }

  const chunks: string[] = [];
  let buffer = "";
  for (const u of units) {
    if (buffer && buffer.length + 1 + u.length > config.targetChunkSize) {
      chunks.push(buffer.trim());
      const tail = wordOverlapTail(buffer, config.chunkOverlap);
      buffer = (tail ? tail + " " : "") + u;
    } else {
      buffer = buffer ? buffer + " " + u : u;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());

  // Merge a tiny trailing chunk back into the previous one.
  if (chunks.length >= 2 && chunks[chunks.length - 1].length < config.minChunkSize) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${last}`.trim();
  }
  return chunks;
}

// Split a single block into two balanced halves at a sentence boundary, with overlap.
function forceSplitInTwo(text: string, config: ChunkingConfig): string[] {
  const sentences = splitSentences(text);
  let a: string;
  let rest: string;
  if (sentences.length >= 2) {
    const mid = Math.ceil(sentences.length / 2);
    a = sentences.slice(0, mid).join(" ").trim();
    rest = sentences.slice(mid).join(" ").trim();
  } else {
    // No sentence boundaries: split at the midpoint on a word boundary.
    const target = Math.floor(text.length / 2);
    let cut = text.lastIndexOf(" ", target);
    if (cut < text.length * 0.3) cut = text.indexOf(" ", target);
    if (cut <= 0) return [text];
    a = text.slice(0, cut).trim();
    rest = text.slice(cut).trim();
  }
  if (!rest) return [text];
  const overlap = wordOverlapTail(a, config.chunkOverlap);
  const b = `${overlap ? overlap + " " : ""}${rest}`.trim();
  return [a, b];
}

// Deterministic, sentence-aware chunking. Heading-aware, robust to plain text
// without blank lines, and guaranteed to produce usable chunks for any real doc.
export function chunkDocument(
  doc: LiveLabDocument,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG,
): DocumentChunk[] {
  const text = normalizeWhitespace(doc.rawText);
  if (!text) return [];

  const sections = toSections(text, config.preserveHeadings);
  const chunks: DocumentChunk[] = [];
  let index = 0;
  const createdAt = new Date().toISOString();

  const push = (content: string, heading?: string) => {
    const t = content.trim();
    if (!t) return;
    chunks.push({
      id: `chunk-${index}`,
      documentId: doc.id,
      chunkIndex: index,
      heading,
      text: t,
      characterCount: t.length,
      estimatedTokens: estimateTokens(t),
      metadata: { source: doc.name, section: heading, createdAt },
    });
    index += 1;
  };

  for (const section of sections) {
    for (const piece of packBody(section.body, config)) push(piece, section.heading);
  }

  // Fallback: never return zero chunks for non-empty input.
  if (chunks.length === 0) {
    for (const piece of packBody(text, config)) push(piece, undefined);
  }

  // If a short document collapsed into a single chunk, split it so the lab can
  // still demonstrate retrieval over multiple passages.
  if (chunks.length === 1 && chunks[0].text.length > config.minChunkSize * 2) {
    const only = chunks[0];
    const halves = forceSplitInTwo(only.text, config);
    if (halves.length === 2) {
      chunks.length = 0;
      index = 0;
      for (const h of halves) push(h, only.heading);
    }
  }

  return chunks;
}
