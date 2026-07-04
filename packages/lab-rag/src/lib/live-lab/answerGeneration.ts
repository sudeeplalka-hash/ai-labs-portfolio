import type { GeneratedLiveAnswer, RetrievedLiveChunk } from "@rag/types/liveLab";
import { contentWords, splitSentences, cleanSentence } from "./textUtils";
import { buildBoilerplateSet, isBoilerplate } from "./boilerplate";
import { metaWeight } from "./retrieval";

export interface AnswerGenerator {
  generateAnswer(input: {
    question: string;
    retrievedChunks: RetrievedLiveChunk[];
  }): Promise<GeneratedLiveAnswer>;
}

type QType = "boolean" | "quantity" | "who" | "when" | "where" | "how" | "list" | "what" | "general";

interface Candidate {
  sentence: string;
  score: number;
  chunk: RetrievedLiveChunk;
}

const LEADING_WEAK = new Set([
  "this", "that", "these", "those", "it", "they", "he", "she", "however",
  "consequently", "therefore", "thus", "but", "and", "so", "if", "because",
  "which", "who", "then", "meanwhile", "moreover", "furthermore", "additionally",
  "also", "instead", "otherwise", "hence",
]);

const firstWord = (s: string) => (s.toLowerCase().match(/[a-z]+/) ?? [""])[0];

function classify(q: string): QType {
  const s = q.toLowerCase().trim();
  if (/\bhow (much|many)\b|\blimit\b|\bcap\b|\bmaximum\b|\bminimum\b|\brate\b|\bpercentage\b|\$|\bcost\b|\bprice\b|\bfee\b/.test(s)) return "quantity";
  if (/\bwhen\b|\bdate\b|how long|how often|\bdeadline\b|within how|what year/.test(s)) return "when";
  if (/\bwho\b|\bfounder\b|\bceo\b|\bauthor\b/.test(s)) return "who";
  if (/\bwhere\b|\blocation\b|located|headquarter/.test(s)) return "where";
  if (/^how (do|to|can|does|should|is|are|did)|\bsteps\b|\bprocess\b|\bprocedure\b/.test(s)) return "how";
  if (/what (are|kinds|types)|^list\b|which .*(documents|steps|items|requirements|features)/.test(s)) return "list";
  if (/^(is|are|can|does|do|should|will|may|must|could|would|has|have|was|were)\b/.test(s)) return "boolean";
  if (/\bwhat\b|\bdefine\b|\bdescribe\b|\bexplain\b/.test(s)) return "what";
  return "general";
}

const HAS_NUMBER = /\$?\d|\bpercent\b|%/;
const DATE_WORDS = /\b(19|20)\d{2}\b|\bjanuary|february|march|april|may|june|july|august|september|october|november|december|\bday|week|month|year|days|weeks|months|years\b/i;
const WHO_HINT = /\b(founder|founded|co-?founder|ceo|started|established|by [A-Z])\b/;

const dedupeKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const NOTE = "Answer drawn only from the retrieved passages. If the most relevant passage wasn't retrieved, it may be incomplete.";

// Document-agnostic, confidence-calibrated generator. It reads the question's
// intent, prefers clear self-contained evidence, cleans extraction artifacts,
// and phrases the answer with appropriate certainty.
export class SimulatedAnswerGenerator implements AnswerGenerator {
  async generateAnswer({
    question,
    retrievedChunks,
  }: {
    question: string;
    retrievedChunks: RetrievedLiveChunk[];
  }): Promise<GeneratedLiveAnswer> {
    if (!retrievedChunks.length) {
      return {
        answer: "I couldn't find anything in this document related to your question, so there isn't enough evidence to answer it.",
        citations: [],
        mode: "simulated",
        caveats: ["No relevant evidence was retrieved.", "Try rephrasing, or use a document that covers this topic."],
      };
    }

    const qType = classify(question);
    const repeated = buildBoilerplateSet(retrievedChunks.map((c) => c.text));
    const qWords = new Set(contentWords(question).map((w) => w.replace(/[^a-z0-9]/g, "")));
    const topRel = Math.max(...retrievedChunks.map((c) => c.relevanceScore));

    const candidates: Candidate[] = [];
    for (const chunk of retrievedChunks.slice(0, 4)) {
      for (const raw of splitSentences(chunk.text)) {
        const sentence = raw.trim();
        if (sentence.length < 35 || sentence.length > 320) continue;
        if (sentence.endsWith("?")) continue;
        if (isBoilerplate(sentence, repeated)) continue;

        const words = contentWords(sentence).map((w) => w.replace(/[^a-z0-9]/g, ""));
        let overlap = 0;
        for (const w of words) if (qWords.has(w)) overlap += metaWeight(w);

        const standalonePenalty = LEADING_WEAK.has(firstWord(sentence)) ? 0.9 : 0;
        const rankBonus = (5 - Math.min(5, chunk.rank)) * 0.05;

        // Intent bonus: nudge toward the sentence that actually carries the answer.
        let intentBonus = 0;
        if ((qType === "quantity") && HAS_NUMBER.test(sentence)) intentBonus = 0.5;
        if (qType === "when" && DATE_WORDS.test(sentence)) intentBonus = 0.5;
        if (qType === "who" && WHO_HINT.test(sentence)) intentBonus = 0.5;

        candidates.push({ sentence, score: overlap + intentBonus - standalonePenalty + rankBonus, chunk });
      }
    }

    const seen: string[] = [];
    const ranked = candidates
      .sort((a, b) => b.score - a.score || a.chunk.rank - b.chunk.rank)
      .filter((c) => {
        const k = dedupeKey(c.sentence);
        if (k.length < 8) return false;
        if (seen.some((p) => p.includes(k) || k.includes(p))) return false;
        seen.push(k);
        return true;
      });

    const onTopic = ranked.filter((c) => c.score >= 0.6);

    // Distinct ORIGINAL question content words present in a sentence — the key
    // calibration signal (matching only the document's main noun isn't enough).
    const qContent = [...qWords].filter((w) => w.length >= 4);
    const distinctMatches = (sentence: string) => {
      const set = new Set(contentWords(sentence).map((w) => w.replace(/[^a-z0-9]/g, "")));
      return qContent.filter((w) => set.has(w)).length;
    };
    const leadMatches = onTopic.length ? distinctMatches(onTopic[0].sentence) : 0;

    const confidence: "high" | "medium" | "low" =
      onTopic.length && topRel >= 0.68 && leadMatches >= 2
        ? "high"
        : onTopic.length && leadMatches >= 1
        ? "medium"
        : "low";

    let used: Candidate[];
    if (confidence === "low") {
      const earliest = [...ranked].sort((a, b) => a.chunk.chunkIndex - b.chunk.chunkIndex);
      used = earliest.slice(0, 1);
    } else {
      used = [onTopic[0]];
      const second = onTopic.slice(1).find((c) => !LEADING_WEAK.has(firstWord(c.sentence)));
      if (second && confidence === "high") used.push(second);
    }

    if (!used.length) {
      return {
        answer: "The retrieved passages were mostly boilerplate (headers, copyright, or page footers) rather than content that answers your question. Try a more specific question.",
        citations: [],
        mode: "simulated",
        caveats: ["Retrieved evidence was not substantive.", "Try a more specific question or a different document."],
      };
    }

    const citations: string[] = [];
    const cleaned = used.map((c) => {
      if (!citations.includes(c.chunk.citationLabel)) citations.push(c.chunk.citationLabel);
      return { text: cleanSentence(c.sentence), cite: c.chunk.citationLabel };
    });

    // Calibrated phrasing.
    let body: string;
    const caveats: string[] = [NOTE];
    if (confidence === "high") {
      body = cleaned.map((c) => `${c.text.replace(/[.?!]$/, "")} [${c.cite}].`).join(" ");
    } else if (confidence === "medium") {
      const first = cleaned[0];
      const lower = first.text.charAt(0).toLowerCase() + first.text.slice(1);
      body = `The document indicates that ${lower.replace(/[.?!]$/, "")} [${first.cite}].`;
      caveats.unshift("Retrieval was moderate — worth verifying against the cited passage.");
    } else {
      const first = cleaned[0];
      body = `I couldn't find a passage that directly answers this. The closest detail the document offers is: “${first.text.replace(/[.?!]$/, "")}” [${first.cite}].`;
      caveats.unshift("The question isn't directly covered, so this is the nearest content rather than a precise answer.");
    }

    const finalAnswer = body.charAt(0).toUpperCase() + body.slice(1);
    return { answer: finalAnswer, citations, mode: "simulated", caveats };
  }
}

export function getAnswerGenerator(): AnswerGenerator {
  return new SimulatedAnswerGenerator();
}
