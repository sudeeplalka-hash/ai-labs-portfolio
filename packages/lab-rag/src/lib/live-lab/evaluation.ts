import type {
  GeneratedLiveAnswer,
  LiveEvaluationResult,
  QualityGateStatus,
  RetrievedLiveChunk,
} from "@rag/types/liveLab";
import {
  contentWords,
  extractNumerics,
  HIGH_RISK_TERMS,
  POLICY_KEYWORDS,
  uniqueContentWords,
} from "./textUtils";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Strip citation markers and the evaluator note before grounding analysis.
function answerProse(answer: string): string {
  return answer.replace(/\[?C\d+\]?/g, " ").replace(/Evaluator note:[\s\S]*$/i, " ");
}

export function evaluateLiveAnswer(
  question: string,
  retrievedChunks: RetrievedLiveChunk[],
  answer: GeneratedLiveAnswer,
): LiveEvaluationResult {
  const failureReasons: string[] = [];
  const usedChunks = retrievedChunks.filter((c) => c.usedInAnswer);
  const citedChunks = retrievedChunks.filter((c) => answer.citations.includes(c.citationLabel));

  // --- Retrieval relevance: average of retrieved relevance scores (0-100) ---
  const retrievalRelevance = retrievedChunks.length
    ? clamp((retrievedChunks.reduce((s, c) => s + c.relevanceScore, 0) / retrievedChunks.length) * 100)
    : 0;
  if (retrievalRelevance < 50) failureReasons.push("Retrieval relevance is low — the evidence may not match the question.");

  // --- Citation coverage: cited / used ---
  const citationCoverage = usedChunks.length
    ? clamp((citedChunks.length / usedChunks.length) * 100)
    : answer.citations.length
    ? 100
    : 0;
  if (answer.citations.length === 0) failureReasons.push("The answer contains no citations.");

  // --- Citation accuracy: deterministic additive rule ---
  let citationAccuracy: number;
  if (citedChunks.length === 0) {
    citationAccuracy = 0;
  } else {
    const qWords = uniqueContentWords(question);
    const answerWords = uniqueContentWords(answerProse(answer.answer));
    let total = 0;
    for (const c of citedChunks) {
      let s = 0;
      const cWords = uniqueContentWords(c.text);
      s += 40; // citation points to a real retrieved chunk
      if ([...qWords].some((w) => cWords.has(w))) s += 30; // query keyword overlap
      if ([...answerWords].some((w) => cWords.has(w))) s += 30; // supports answer sentence
      total += s;
    }
    citationAccuracy = clamp(total / citedChunks.length);
  }
  if (citationAccuracy < 70 && citedChunks.length > 0)
    failureReasons.push("Citations only partially support the answer claims.");

  // --- Faithfulness: answer grounding in retrieved context, penalize unsupported specifics ---
  const contextText = retrievedChunks.map((c) => c.text).join(" ");
  const contextWordSet = uniqueContentWords(contextText);
  const answerWordList = contentWords(answerProse(answer.answer));
  const groundedWords = answerWordList.filter((w) => contextWordSet.has(w));
  let faithfulness = answerWordList.length
    ? clamp((groundedWords.length / answerWordList.length) * 100)
    : 0;

  // Penalize numbers/policy terms in the answer that are absent from retrieved context.
  const contextNumerics = new Set(extractNumerics(contextText));
  const answerNumerics = extractNumerics(answerProse(answer.answer));
  const ungroundedNumerics = answerNumerics.filter((n) => !contextNumerics.has(n));
  if (ungroundedNumerics.length) {
    faithfulness = clamp(faithfulness - ungroundedNumerics.length * 12);
    failureReasons.push(`Answer contains figures not found in the evidence: ${ungroundedNumerics.slice(0, 3).join(", ")}.`);
  }
  const ql = question.toLowerCase();
  const al = answer.answer.toLowerCase();
  const ungroundedPolicyTerms = POLICY_KEYWORDS.filter(
    (k) => al.includes(k) && !contextText.toLowerCase().includes(k) && !ql.includes(k),
  );
  if (ungroundedPolicyTerms.length) faithfulness = clamp(faithfulness - ungroundedPolicyTerms.length * 6);
  if (faithfulness < 70) failureReasons.push("Parts of the answer are not clearly grounded in the retrieved evidence.");

  // --- Answer completeness ---
  const qWordsArr = contentWords(question);
  const coveredQueryTerms = qWordsArr.filter((w) => contextWordSet.has(w)).length;
  const queryCoverage = qWordsArr.length ? coveredQueryTerms / qWordsArr.length : 0;
  const acknowledgesLimits = answer.caveats.length > 0 ? 1 : 0;
  const chunkFactor = Math.min(1, retrievedChunks.length / 4);
  const answerCompleteness = clamp(
    queryCoverage * 60 + chunkFactor * 25 + acknowledgesLimits * 15,
  );
  if (answerCompleteness < 60) failureReasons.push("The answer may not cover all parts of the question.");

  // --- Context utilization: used / retrieved ---
  const contextUtilization = retrievedChunks.length
    ? clamp((usedChunks.length / retrievedChunks.length) * 100)
    : 0;

  // --- Hallucination risk: inverse of faithfulness + citation accuracy, with bumps ---
  let hallucinationRisk = clamp(100 - (faithfulness * 0.6 + citationAccuracy * 0.4));
  if (ungroundedNumerics.length) hallucinationRisk = clamp(hallucinationRisk + 8);
  if (ungroundedPolicyTerms.length) hallucinationRisk = clamp(hallucinationRisk + 5);
  if (answer.citations.length === 0) hallucinationRisk = clamp(hallucinationRisk + 10);
  if (retrievalRelevance < 45) hallucinationRisk = clamp(hallucinationRisk + 8);

  // --- Overall quality (published weighting) ---
  const overallQuality = clamp(
    retrievalRelevance * 0.25 +
      citationAccuracy * 0.2 +
      faithfulness * 0.25 +
      answerCompleteness * 0.15 +
      contextUtilization * 0.05 +
      (100 - hallucinationRisk) * 0.1,
  );

  // --- Human review required ---
  const highRiskHit = HIGH_RISK_TERMS.find((t) => ql.includes(t) || al.includes(t));
  const humanReviewRequired =
    hallucinationRisk > 35 ||
    citationAccuracy < 70 ||
    faithfulness < 70 ||
    Boolean(highRiskHit);
  if (highRiskHit) failureReasons.push(`High-risk topic detected ("${highRiskHit}") — human review recommended.`);

  // --- Quality gate ---
  let qualityGateStatus: QualityGateStatus;
  if (overallQuality >= 80 && hallucinationRisk <= 20 && citationAccuracy >= 80) {
    qualityGateStatus = "Passed";
  } else if (overallQuality >= 65 && hallucinationRisk <= 35) {
    qualityGateStatus = "Warning";
  } else {
    qualityGateStatus = "Failed";
  }

  const evaluatorSummary = buildSummary(qualityGateStatus, retrievedChunks.length, citedChunks.length, overallQuality);
  const userFriendlyExplanation = buildExplanation({
    retrievedCount: retrievedChunks.length,
    citedCount: citedChunks.length,
    usedCount: usedChunks.length,
    retrievalRelevance,
    citationAccuracy,
    faithfulness,
    hallucinationRisk,
    humanReviewRequired,
    qualityGateStatus,
    highRiskHit,
  });

  return {
    retrievalRelevance,
    citationCoverage,
    citationAccuracy,
    faithfulness,
    answerCompleteness,
    contextUtilization,
    hallucinationRisk,
    overallQuality,
    humanReviewRequired,
    qualityGateStatus,
    failureReasons: failureReasons.length ? failureReasons : ["No major quality issues detected."],
    evaluatorSummary,
    userFriendlyExplanation,
  };
}

function buildSummary(
  gate: QualityGateStatus,
  retrieved: number,
  cited: number,
  overall: number,
): string {
  if (gate === "Passed")
    return `The answer is well grounded: ${retrieved} chunks retrieved, ${cited} cited, overall quality ${overall}%. Safe to use with normal oversight.`;
  if (gate === "Warning")
    return `The answer is mostly useful (overall ${overall}%), but citation support or grounding is not strong enough for production use without review.`;
  return `The answer did not meet quality thresholds (overall ${overall}%). Treat it as unreliable until the evidence is reviewed.`;
}

interface ExplainInput {
  retrievedCount: number;
  citedCount: number;
  usedCount: number;
  retrievalRelevance: number;
  citationAccuracy: number;
  faithfulness: number;
  hallucinationRisk: number;
  humanReviewRequired: boolean;
  qualityGateStatus: QualityGateStatus;
  highRiskHit?: string;
}

// Plain-English narrative used by the EvaluatorFeedbackPanel.
function buildExplanation(i: ExplainInput): string[] {
  const out: string[] = [];
  out.push(
    `The evaluator compared your question against the document chunks and selected the ${i.retrievedCount} most relevant passages, then checked whether the answer was supported by them and whether the citations pointed to useful evidence.`,
  );

  if (i.retrievalRelevance >= 60 && i.citedCount > 0) {
    out.push(
      `The retriever found ${i.retrievedCount} relevant chunks and the answer cited ${i.citedCount} of them, so most of the response is grounded in the retrieved text.`,
    );
  } else if (i.citedCount > 0) {
    out.push(
      `The answer cited ${i.citedCount} chunk(s), but retrieval relevance was modest (${i.retrievalRelevance}%), so some of the response may not be fully supported.`,
    );
  } else {
    out.push("The answer included no citations, which makes it hard to verify and raises hallucination risk.");
  }

  if (i.faithfulness < 70 || i.citationAccuracy < 70) {
    out.push(
      `Grounding is the weak spot: faithfulness ${i.faithfulness}% and citation accuracy ${i.citationAccuracy}%. Some claims are only partially backed by the cited passages.`,
    );
  }
  if (i.highRiskHit) {
    out.push(
      `Because this is a high-risk topic ("${i.highRiskHit}"), the evaluator recommends human review before relying on the answer.`,
    );
  }

  if (i.qualityGateStatus === "Passed") {
    out.push("Quality decision: Passed. The answer is grounded and cited well enough for normal use.");
    out.push("Recommended next step: spot-check the cited chunks, then proceed.");
  } else if (i.qualityGateStatus === "Warning") {
    out.push("Quality decision: Warning. The answer is mostly useful but should be reviewed before production use.");
    out.push("Recommended next step: open the Retrieved Evidence panel and confirm the cited chunks actually support each claim.");
  } else {
    out.push("Quality decision: Failed. The answer is not reliable as-is.");
    out.push("Recommended next step: rephrase the question or upload a document with more relevant content, then re-run.");
  }
  return out;
}
