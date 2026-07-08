import type {
  CheckResult,
  ChunkPreview,
  ColumnProfile,
  GateVerdict,
  Level,
  PiiFinding,
  PrepReport,
  Profile,
  TabularProfile,
  TextProfile,
} from "./types";
import { RULEBOOK } from "./rulebook";
import { applyProfile, type ProfileId } from "./profiles";

// Tunable org-policy thresholds. Defaults reproduce the standard ruleset; the
// Live Data Lab lets a user adjust these and re-score the file live.
export interface PrepConfig {
  /** Above this % of empty cells, missing values become "at risk". */
  maxMissingPct: number;
  /** Above this % of duplicate rows, duplicates become "at risk". */
  maxDupPct: number;
  /** If true, ANY detected PII (not just SSN/card) is a hard blocker. */
  piiStrict: boolean;
  /** If false, the taxonomy/metadata guideline is not enforced. */
  requireMetadata: boolean;
}

export const DEFAULT_CONFIG: PrepConfig = {
  maxMissingPct: 15,
  maxDupPct: 5,
  piiStrict: false,
  requireMetadata: true,
};

// ----------------------------------------------------------------------------
// Parsing
// ----------------------------------------------------------------------------

/** Quote-aware CSV/TSV parser. */
export function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === delim) {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c === "\r") {
      /* skip */
    } else cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

export function inferType(v: string | null | undefined): string {
  if (v == null || v.trim() === "") return "empty";
  const t = v.trim();
  if (/^-?\$?\d{1,3}(,\d{3})*(\.\d+)?%?$/.test(t) || /^-?\d*\.?\d+$/.test(t)) return "number";
  if (/^(true|false|yes|no|y|n)$/i.test(t)) return "bool";
  if (/^\d{4}-\d{2}-\d{2}/.test(t) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(t)) return "date";
  return "string";
}

// ----------------------------------------------------------------------------
// PII
// ----------------------------------------------------------------------------

// Sensitive-data detectors. Unambiguous formats (SSN, card, IBAN, known secret
// tokens) match on shape; ambiguous numbers (routing, account, MRN, NPI, DEA) are
// keyword-anchored so we don't flag every 9-digit string. Compliance profiles then
// escalate any finding to the right bar (HIPAA/PCI/GDPR treat these as blockers).
export const PII_PATTERNS: { type: string; label: string; severe: boolean; re: RegExp }[] = [
  { type: "ssn", label: "SSN", severe: true, re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "card", label: "card number", severe: true, re: /\b(?:\d[ -]?){13,16}\b/g },
  // Financial identifiers
  { type: "iban", label: "IBAN", severe: true, re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,3})?\b/g },
  { type: "routing", label: "bank routing number", severe: true, re: /\b(?:routing(?:\s*number)?|aba)\b[^\d]{0,15}\d{9}\b/gi },
  { type: "bank-account", label: "bank account number", severe: true, re: /\b(?:account|acct)\b[^\d]{0,15}\d{8,17}\b/gi },
  { type: "swift", label: "SWIFT/BIC code", severe: false, re: /\bswift\b[^A-Z0-9]{0,10}[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b/gi },
  // Health / PHI
  { type: "mrn", label: "medical record number", severe: true, re: /\b(?:mrn|medical record(?:\s*(?:no|number|#))?)\b[^\d]{0,10}\d{5,10}\b/gi },
  { type: "npi", label: "NPI (provider ID)", severe: true, re: /\bnpi\b[^\d]{0,10}\d{10}\b/gi },
  { type: "dea", label: "DEA number", severe: true, re: /\bdea\b[^A-Z0-9]{0,10}[A-Z]{2}\d{7}\b/gi },
  { type: "icd", label: "ICD-10 diagnosis code", severe: false, re: /\bICD-?10\b[^A-TV-Z]{0,8}[A-TV-Z]\d{2}(?:\.\d{1,4})?\b/gi },
  // Secrets / credentials
  { type: "secret", label: "API key or secret", severe: true, re: /\b(?:AKIA[0-9A-Z]{16}|sk_(?:live|test)_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g },
  // Contact / network
  { type: "email", label: "email", severe: false, re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { type: "phone", label: "phone", severe: false, re: /(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { type: "ip", label: "IP address", severe: false, re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
];

export function detectPii(text: string): PiiFinding[] {
  const found: PiiFinding[] = [];
  const claimed = new Set<string>();
  for (const p of PII_PATTERNS) {
    const matches = text.match(p.re);
    if (!matches) continue;
    // De-dupe and avoid double-counting (e.g. a card-shaped string also matching phone).
    const uniq = [...new Set(matches.map((m) => m.replace(/[\s-]/g, "")))].filter((m) => {
      if (claimed.has(m)) return false;
      claimed.add(m);
      return true;
    });
    if (uniq.length) found.push({ type: p.type, label: p.label, count: uniq.length, severe: p.severe });
  }
  return found;
}

/** Replace detected PII with block characters (used by click-to-redact preview). */
export function redactPii(text: string): string {
  let out = text;
  for (const p of PII_PATTERNS) {
    out = out.replace(p.re, (m) => "█".repeat(Math.max(4, m.replace(/\s/g, "").length)));
  }
  return out;
}

// ----------------------------------------------------------------------------
// Chunking (readiness preview, NOT retrieval tuning)
// ----------------------------------------------------------------------------

export function chunkText(serialized: string, targetTokens = 512, overlapPct = 0): ChunkPreview {
  const chars = targetTokens * 4;
  const overlapChars = Math.round(chars * (overlapPct / 100));
  const step = Math.max(1, chars - overlapChars);
  const chunks: string[] = [];
  for (let i = 0; i < serialized.length; i += step) chunks.push(serialized.slice(i, i + chars));
  if (chunks.length === 0) chunks.push(serialized);
  const estTokens = Math.round(serialized.length / 4);
  const avgTokens = Math.round(estTokens / chunks.length);
  // crude "oversized" notion: paragraphs longer than the target band
  const oversized = serialized.split(/\n\s*\n/).filter((p) => p.length > chars).length;
  return { count: chunks.length, avgTokens, estTokens, oversized, first: chunks[0] ?? "" };
}

// ----------------------------------------------------------------------------
// Profiling
// ----------------------------------------------------------------------------

interface Parsed {
  kind: "tabular" | "text";
  headers: string[];
  rows: string[][];
  jsonOk: boolean;
  hasReplacement: boolean;
}

export function parseFile(name: string, text: string): Parsed {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  const hasReplacement = text.includes("�");
  if (ext === "csv" || ext === "tsv") {
    const all = parseDelimited(text, ext === "tsv" ? "\t" : ",").filter(
      (r) => !(r.length === 1 && r[0] === ""),
    );
    return { kind: "tabular", headers: all[0] ?? [], rows: all.slice(1), jsonOk: true, hasReplacement };
  }
  if (ext === "json") {
    try {
      const j = JSON.parse(text) as unknown;
      if (Array.isArray(j) && j.length && typeof j[0] === "object" && j[0] !== null) {
        const headers = [...new Set(j.flatMap((o) => Object.keys(o as object)))];
        const rows = (j as Record<string, unknown>[]).map((o) =>
          headers.map((h) => (o[h] == null ? "" : String(o[h]))),
        );
        return { kind: "tabular", headers, rows, jsonOk: true, hasReplacement };
      }
      return { kind: "text", headers: [], rows: [], jsonOk: true, hasReplacement };
    } catch {
      return { kind: "text", headers: [], rows: [], jsonOk: false, hasReplacement };
    }
  }
  return { kind: "text", headers: [], rows: [], jsonOk: true, hasReplacement };
}

function profileTabular(headers: string[], rows: string[][]): TabularProfile {
  const nRows = rows.length;
  const columns: ColumnProfile[] = headers.map((h, ci) => {
    const vals = rows.map((r) => r[ci] ?? "");
    const nonEmpty = vals.filter((v) => v.trim() !== "");
    const types: Record<string, number> = {};
    nonEmpty.forEach((v) => {
      const t = inferType(v);
      types[t] = (types[t] ?? 0) + 1;
    });
    const dominantType =
      Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "empty";
    return {
      name: h,
      dominantType,
      missing: nRows - nonEmpty.length,
      distinct: new Set(nonEmpty.map((v) => v.trim())).size,
      total: nRows,
      types,
      samples: nonEmpty.slice(0, 4),
    };
  });
  const emptyRows = rows.filter((r) => r.every((c) => (c ?? "").trim() === "")).length;
  const seen = new Set<string>();
  let dups = 0;
  rows.forEach((r) => {
    const k = r.join("");
    if (seen.has(k)) dups++;
    else seen.add(k);
  });
  const totalCells = nRows * headers.length || 1;
  const missingCells = columns.reduce((a, c) => a + c.missing, 0);
  return {
    kind: "tabular",
    rows: nRows,
    cols: headers.length,
    columns,
    emptyRows,
    dups,
    missingPct: (missingCells / totalCells) * 100,
  };
}

function profileText(text: string): TextProfile {
  const lines = text.split("\n");
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  const counts: Record<string, number> = {};
  trimmed.forEach((l) => (counts[l] = (counts[l] ?? 0) + 1));
  const repeatedLines = Object.values(counts).filter((c) => c > 2).length;
  return {
    kind: "text",
    words: text.trim().split(/\s+/).filter(Boolean).length,
    lines: lines.length,
    paras: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    chars: text.length,
    repeatedLines,
  };
}

// ----------------------------------------------------------------------------
// Checks (mapped to the org rulebook)
// ----------------------------------------------------------------------------

const pct = (n: number) => Math.round(n * 10) / 10 + "%";

export function runChecks(
  parsed: Parsed,
  profile: Profile,
  pii: PiiFinding[],
  fileName: string,
  config: PrepConfig = DEFAULT_CONFIG,
): CheckResult[] {
  const checks: CheckResult[] = [];
  const add = (
    id: string,
    guideline: CheckResult["guideline"],
    name: string,
    level: Level,
    detail: string,
    fix?: CheckResult["fix"],
  ) =>
    checks.push({
      id,
      guideline,
      name,
      level,
      detail,
      downstream: RULEBOOK[guideline].downstream,
      fix,
    });

  // Format & encoding
  add(
    "encoding",
    "format",
    "Encoding & decoding",
    parsed.hasReplacement ? "risk" : "healthy",
    parsed.hasReplacement
      ? "Replacement characters found, file is not clean UTF-8."
      : "Decoded cleanly as UTF-8.",
    parsed.hasReplacement ? { id: "encoding", label: "Re encode as UTF-8", delta: 8 } : undefined,
  );
  if (parsed.kind === "text" && !parsed.jsonOk) {
    add("jsonvalid", "format", "JSON validity", "critical", "Could not parse as JSON, treated as text.");
  }

  if (profile.kind === "tabular") {
    const p = profile;
    add(
      "structure",
      "format",
      "Structure detected",
      p.cols > 1 ? "healthy" : "watch",
      `${p.rows.toLocaleString()} rows × ${p.cols} column${p.cols > 1 ? "s" : ""} parsed.`,
    );
    if (p.emptyRows > 0)
      add(
        "emptyrows",
        "format",
        "Empty rows",
        p.emptyRows / p.rows > 0.05 ? "risk" : "watch",
        `${p.emptyRows} empty row${p.emptyRows > 1 ? "s" : ""} (${pct((p.emptyRows / p.rows) * 100)}).`,
        { id: "emptyrows", label: "Drop empty rows", delta: 5 },
      );
    if (p.dups > 0)
      add(
        "dups",
        "dedup",
        "Duplicate rows",
        (p.dups / p.rows) * 100 > config.maxDupPct ? "risk" : "watch",
        `${p.dups} duplicate row${p.dups > 1 ? "s" : ""} (${pct((p.dups / p.rows) * 100)}).`,
        { id: "dups", label: "De-duplicate", delta: 9 },
      );
    if (p.missingPct >= 2)
      add(
        "missing",
        "format",
        "Missing values",
        p.missingPct > config.maxMissingPct ? "risk" : "watch",
        `${pct(p.missingPct)} of cells are empty, decide impute vs. drop.`,
        { id: "missing", label: "Resolve missing values", delta: 6 },
      );
    const constCols = p.columns.filter((c) => c.distinct <= 1);
    if (constCols.length)
      add(
        "deadcols",
        "format",
        "Constant / dead columns",
        "watch",
        `${constCols.length} column${constCols.length > 1 ? "s" : ""} carry no signal (${constCols
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}).`,
        { id: "deadcols", label: "Remove dead columns", delta: 4 },
      );
  } else if (profile.kind === "text") {
    const p = profile;
    add(
      "parsedoc",
      "format",
      "Document parsed",
      "healthy",
      `${p.words.toLocaleString()} words · ${(p.paras || p.lines).toLocaleString()} block${
        (p.paras || p.lines) > 1 ? "s" : ""
      }.`,
    );
    if (p.repeatedLines > 0)
      add(
        "boilerplate",
        "format",
        "Boilerplate / repetition",
        p.repeatedLines > 10 ? "risk" : "watch",
        `${p.repeatedLines} line${p.repeatedLines > 1 ? "s" : ""} repeat 3+ times (headers/footers?).`,
        { id: "boilerplate", label: "Strip boilerplate", delta: 7 },
      );
  }

  // Freshness, heuristic on filename/version markers. Tabular exports are
  // routinely versioned by convention (crm_export_v2.csv), so a bare version
  // number only counts as a staleness hint for prose documents; explicit
  // stale markers (legacy/old/superseded/...) count everywhere.
  const staleMarker = /(?:^|[^a-z])(?:old|copy)(?:[^a-z]|$)|legacy|superseded|draft|backup|archive|deprecated/i.test(fileName);
  const bareVersion = /v\d|version/i.test(fileName);
  const isTabularName = /\.(csv|tsv|xlsx?)$/i.test(fileName);
  if (staleMarker || (bareVersion && !isTabularName)) {
    add(
      "freshness",
      "freshness",
      "Freshness & versioning",
      "watch",
      "Filename hints at a versioned or legacy copy, confirm this supersedes prior versions.",
      { id: "freshness", label: "Confirm latest version", delta: 5 },
    );
  }

  // Privacy / PII
  if (pii.length === 0) {
    add("pii", "privacy", "PII & sensitive data", "healthy", "No personal, financial, health, or secret identifiers detected.");
  } else {
    const block = pii.some((p) => p.severe) || config.piiStrict;
    const parts = pii.map((p) => `${p.count} ${p.label}${p.count > 1 ? "s" : ""}`).join(", ");
    add(
      "pii",
      "privacy",
      "PII & sensitive data",
      block ? "critical" : "risk",
      `Detected ${parts}. Must be redacted or approved before ingestion.${config.piiStrict ? " (strict PII policy)" : ""}`,
      { id: "pii", label: block ? "Redact PII (required)" : "Redact / mask PII", delta: block ? 40 : 18, unblocks: block },
    );
  }

  // Provenance, always needs a human owner
  add(
    "provenance",
    "provenance",
    "Provenance & licensing",
    "watch",
    "Source and usage rights cannot be verified automatically, requires a named owner sign off.",
    { id: "provenance", label: "Attach owner sign off", delta: 5 },
  );

  // Taxonomy / metadata (only enforced when the policy requires it)
  if (config.requireMetadata) {
    add(
      "taxonomy",
      "taxonomy",
      "Taxonomy & metadata",
      "watch",
      "Required tags (domain, owner, sensitivity, effective date) are not yet attached.",
      { id: "taxonomy", label: "Tag metadata", delta: 4 },
    );
  }

  return checks;
}

// ----------------------------------------------------------------------------
// Scoring & gate
// ----------------------------------------------------------------------------

const LEVEL_PENALTY: Record<Level, number> = { healthy: 0, watch: 6, risk: 16, critical: 34 };

/** Score given a set of applied fix-ids (empty = base score). */
export function scoreWithFixes(checks: CheckResult[], applied: Set<string>): number {
  let penalty = 0;
  for (const c of checks) {
    if (c.fix && applied.has(c.fix.id)) continue; // fixed → no penalty
    penalty += LEVEL_PENALTY[c.level];
  }
  return Math.max(2, Math.min(100, 100 - penalty));
}

export function hasUnclearedBlocker(checks: CheckResult[], applied: Set<string>): boolean {
  return checks.some((c) => c.level === "critical" && !(c.fix && applied.has(c.fix.id)));
}

export function computeGate(score: number, blocker: boolean): GateVerdict {
  if (blocker)
    return {
      score,
      verdict: "Blocked",
      color: "rose",
      gate: "Rejected",
      summary:
        "A hard blocker (sensitive PII or unreadable content) must be resolved before this file can be considered for ingestion.",
    };
  if (score >= 85)
    return {
      score,
      verdict: "Ready",
      color: "emerald",
      gate: "Approved",
      summary: "Clean enough to ingest. Remaining items are cosmetic and won't affect retrieval quality.",
    };
  if (score >= 65)
    return {
      score,
      verdict: "Needs review",
      color: "amber",
      gate: "Conditional",
      summary: "Usable after a light cleanup pass. Apply the watch level fixes, then it clears the gate.",
    };
  return {
    score,
    verdict: "Not ready",
    color: "orange",
    gate: "Hold",
    summary: "Several issues would degrade retrieval or leak unwanted content. Clear the at risk items before resubmitting.",
  };
}

// ----------------------------------------------------------------------------
// Orchestration
// ----------------------------------------------------------------------------

export function serialize(parsed: Parsed, text: string): string {
  if (parsed.kind === "tabular") {
    return parsed.rows
      .slice(0, 2000)
      .map((r) => parsed.headers.map((h, i) => `${h}: ${r[i] ?? ""}`).join(" | "))
      .join("\n");
  }
  return text;
}

export function buildReport(
  fileName: string,
  text: string,
  sizeBytes: number,
  profileId: ProfileId = "general",
  config: PrepConfig = DEFAULT_CONFIG,
): PrepReport {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  const parsed = parseFile(fileName, text);
  const profile: Profile =
    parsed.kind === "tabular" ? profileTabular(parsed.headers, parsed.rows) : profileText(text);
  const pii = detectPii(text);
  const serialized = serialize(parsed, text);
  const chunk = chunkText(serialized, 512, 0);
  const checks = applyProfile(runChecks(parsed, profile, pii, fileName, config), profileId);
  const baseScore = scoreWithFixes(checks, new Set());
  return {
    fileName,
    sizeKB: sizeBytes / 1024,
    ext,
    kind: parsed.kind,
    profile,
    checks,
    pii,
    chunk,
    serialized,
    baseScore,
  };
}
