// ============================================================================
// Reframe (Move 2). Turns whatever the visitor typed into one clear, specific
// problem, echoing their own words back. Deterministic and offline; a real model
// can implement the Reframer interface later without touching the UI.
// ============================================================================
import type { FramingParams } from "./types";

export interface ReframeInput {
  rawAmbition: string;
  params: FramingParams;
}

export interface ReframeResult {
  sharpenedProblem: string;
  source: "curated" | "generated live";
}

export interface Reframer {
  reframe(input: ReframeInput): Promise<ReframeResult>;
}

// Clean, grammatical outcome phrase per pain (no dashes).
const PAIN_FIX: Record<string, string> = {
  "Too slow": "the waiting goes away",
  "Inconsistent": "the answers finally line up",
  "Too expensive": "the cost comes down",
  "Hard to scale": "it scales without strain",
  "Error prone": "the costly mistakes stop",
  "Knowledge trapped": "what is already known is easy to reach",
  "Poor experience": "the experience feels effortless",
  "Impossible today": "it becomes possible at all",
};

const LEADING = /^(i\s*('m|am)?\s*)?(really\s+)?(want|wish|would\s+like|need|hope|like|love)\s+(to\s+|that\s+|our\s+|my\s+|us\s+to\s+|the\s+)?|^we\s+(really\s+)?(want|wish|need|would\s+like)\s+(to\s+|our\s+|the\s+)?|^help\s+(me\s+|us\s+|our\s+)?|^can\s+(we|you|i)\s+|^please\s+|^i'?d\s+like\s+to\s+/i;

/** Pull the meaningful goal out of the typed ambition so we can echo it back. */
export function topicFromAmbition(raw: string): string {
  let t = (raw || "").replace(/\s+/g, " ").trim();
  t = t.replace(LEADING, "");
  t = t.replace(/^(to|that|our|my|the)\s+/i, "");
  t = t.replace(/[.?!]+$/, "").trim();
  const words = t.split(" ");
  if (words.length > 18) t = words.slice(0, 18).join(" ") + "…";
  return t;
}

export function curatedReframe({ rawAmbition, params }: ReframeInput): ReframeResult {
  const u = params.user.toLowerCase();
  const fix = PAIN_FIX[params.pain] ?? "the pain goes away";
  const topic = topicFromAmbition(rawAmbition);

  const sharpenedProblem = topic.length > 6
    ? `The clear version of "${topic}": start with the narrow, high value slice ${u} run into most often, lean on the answers you already have, so ${fix}. Prove it with a single number you can actually fail.`
    : `Make it faster and easier for ${u} to get what they need. Start with the requests they hit most often, lean on the answers you already have, so ${fix}. Prove it with a single number you can actually fail.`;

  return { sharpenedProblem, source: "curated" };
}

export const defaultReframer: Reframer = {
  async reframe(input) { return curatedReframe(input); },
};
