import type { PrepReport } from "./types";

// The consequence simulator: what would the RAG system answer if this file were
// ingested AS-IS versus PREPARED? This is the connective tissue to the RAG
// Evaluator — it shows the bad answer that preparation prevents.
export type AnswerVerdict = "wrong" | "risky" | "ok";

export interface SimAnswer {
  answer: string;
  verdict: AnswerVerdict;
  note: string;
}

export interface Consequence {
  question: string;
  asIs: SimAnswer;
  prepared: SimAnswer;
  /** what preparation changed to fix it */
  fixedBy: string;
}

const CANNED: Record<string, Consequence> = {
  stale: {
    question: "What is the daily meal allowance for domestic travel?",
    asIs: {
      answer: "The daily meal allowance is $60 [Travel Policy v2.7]. It is also listed as $75 [Travel Policy v3.1].",
      verdict: "wrong",
      note: "A superseded version was ingested alongside the current one, so the AI cites both and contradicts itself.",
    },
    prepared: {
      answer: "The daily meal allowance is $75 for domestic travel [Travel Policy v3.1].",
      verdict: "ok",
      note: "The stale v2.7 copy was quarantined, leaving one authoritative source.",
    },
    fixedBy: "Freshness & versioning — the superseded copy was removed before ingestion.",
  },
  crm: {
    question: "What is Katherine Johnson's payment information?",
    asIs: {
      answer: "Katherine Johnson's card on file is 4111 1111 1111 1111.",
      verdict: "risky",
      note: "Un-redacted card and SSN data was embedded, so the AI will happily retrieve and reveal it.",
    },
    prepared: {
      answer: "I don't have access to payment-card details for that customer.",
      verdict: "ok",
      note: "PII was redacted before embedding, so it is no longer retrievable.",
    },
    fixedBy: "Privacy & PII — card and SSN values were redacted before ingestion.",
  },
  kb: {
    question: "What are the standard payment terms for new vendors?",
    asIs: {
      answer: "Standard terms are Net 30.",
      verdict: "risky",
      note: "The answer is correct but uncitable — no owner, source, or effective date was attached, so it can't be trusted or access-controlled.",
    },
    prepared: {
      answer: "Standard terms are Net 30 [Vendor Onboarding KB · owner: Procurement · effective 2024-04].",
      verdict: "ok",
      note: "Metadata was attached, so the answer is citable and governable.",
    },
    fixedBy: "Taxonomy & metadata — domain, owner, and effective date were tagged.",
  },
  clean: {
    question: "What is the main remaining risk this quarter?",
    asIs: {
      answer: "The main remaining risk is latency under peak load.",
      verdict: "ok",
      note: "This file was already clean, so as-is and prepared answers are essentially the same.",
    },
    prepared: {
      answer: "The main remaining risk is latency under peak load [Eng Update Q2].",
      verdict: "ok",
      note: "Little to fix — preparation mainly added a clean citation.",
    },
    fixedBy: "Already clean — only light formatting and a citation were added.",
  },
};

export function getConsequence(report: PrepReport, sampleId?: string): Consequence {
  if (sampleId && CANNED[sampleId]) return CANNED[sampleId];

  // Generic, derived from the file's actual findings.
  const severePii = report.pii.some((p) => p.severe);
  const anyPii = report.pii.length > 0;
  const dups = report.profile.kind === "tabular" ? report.profile.dups : 0;
  const stale = report.checks.some((c) => c.guideline === "freshness");
  const boilerplate = report.profile.kind === "text" ? report.profile.repeatedLines > 0 : false;

  if (anyPii) {
    const kind = severePii ? "an SSN or card number" : "an email or phone number";
    return {
      question: "If the AI were asked about an individual in this file…",
      asIs: {
        answer: `It could retrieve and reveal ${kind} embedded from this file.`,
        verdict: "risky",
        note: "Anything embedded becomes retrievable — un-redacted PII leaks straight into answers.",
      },
      prepared: {
        answer: "It declines, because the sensitive values were redacted before embedding.",
        verdict: "ok",
        note: "PII was cleared at the privacy gate.",
      },
      fixedBy: "Privacy & PII — sensitive values were redacted before ingestion.",
    };
  }
  if (dups > 0) {
    return {
      question: "If the AI were asked about a fact that appears multiple times here…",
      asIs: {
        answer: "It over-weights the duplicated rows and biases toward that repeated content.",
        verdict: "risky",
        note: `${dups} duplicate row(s) inflate retrieval frequency.`,
      },
      prepared: {
        answer: "It treats the fact once, with balanced retrieval.",
        verdict: "ok",
        note: "Duplicates were removed before ingestion.",
      },
      fixedBy: "De-duplication — repeated rows were collapsed to one authoritative copy.",
    };
  }
  if (stale) {
    return {
      question: "If the AI were asked a question this file answers…",
      asIs: {
        answer: "It may cite a superseded version and contradict the current one.",
        verdict: "wrong",
        note: "A versioned/legacy file can conflict with the current source.",
      },
      prepared: {
        answer: "It cites a single authoritative version.",
        verdict: "ok",
        note: "Stale versions were quarantined.",
      },
      fixedBy: "Freshness & versioning — older copies were quarantined.",
    };
  }
  if (boilerplate) {
    return {
      question: "If the AI were asked about this document…",
      asIs: {
        answer: "Repeated headers/footers crowd the retrieved context and dilute the real answer.",
        verdict: "risky",
        note: "Boilerplate wastes the context window.",
      },
      prepared: {
        answer: "The answer is concise and grounded in the substantive text.",
        verdict: "ok",
        note: "Boilerplate was stripped.",
      },
      fixedBy: "Format — repeated boilerplate lines were removed.",
    };
  }
  return {
    question: "If the AI were asked about this file…",
    asIs: {
      answer: "It would answer about as well as the prepared version.",
      verdict: "ok",
      note: "This file is already in good shape — little preparation was needed.",
    },
    prepared: {
      answer: "It answers cleanly, with a citation.",
      verdict: "ok",
      note: "Only light cleanup and a citation were added.",
    },
    fixedBy: "Already clean — minimal preparation required.",
  };
}
