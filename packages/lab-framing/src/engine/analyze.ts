// ============================================================================
// Ambition analysis. Pulls the OBJECT (what the AI acts on — tickets, invoices,
// claims…) and the INTENT (answer, summarize, detect, route…) out of the typed
// question, so the backlog generates ideas that are actually about what the user
// asked, not generic templates. Deterministic and offline.
// ============================================================================
import type { JobKey } from "./types";

// Domain nouns we can recognise as the "thing" the system works on. Multi-word
// entries are matched first (sorted by length) so "support tickets" beats "tickets".
const DOMAIN_NOUNS = [
  "support tickets", "purchase orders", "service requests", "knowledge base",
  "customer questions", "help requests", "sales leads", "job applications",
  "tickets", "questions", "faqs", "emails", "invoices", "contracts", "claims",
  "documents", "docs", "candidates", "resumes", "applications", "leads", "orders",
  "reviews", "logs", "alerts", "reports", "cases", "requests", "queries", "feedback",
  "transactions", "tasks", "incidents", "policies", "records", "messages", "calls",
  "complaints", "disputes", "forms", "articles", "posts", "products", "accounts",
  "payments", "shipments", "returns", "refunds", "bookings", "appointments",
  "proposals", "tenders", "spreadsheets", "datasets", "manuals", "guidelines",
];

// The Job dropdown IS the intent — it's the explicit control, so it drives the
// verb/noun woven through every idea. (The free-text question supplies the object.)
const INTENT_INFO: Record<string, { verb: string; noun: string }> = {
  answer: { verb: "answer", noun: "answers" },
  summarize: { verb: "summarize", noun: "summaries" },
  extract: { verb: "extract", noun: "extraction" },
  classify: { verb: "route", noun: "triage" },
  recommend: { verb: "recommend", noun: "recommendations" },
  detect: { verb: "flag", noun: "detection" },
  generate: { verb: "draft", noun: "drafts" },
  automate: { verb: "resolve", noun: "resolution" },
};

const JOB_NOUN: Record<JobKey, string> = {
  Answer: "questions", Summarize: "documents", Extract: "documents", Classify: "items",
  Decide: "decisions", Monitor: "activity", Generate: "content", Orchestrate: "tasks",
};
const JOB_INTENT: Record<JobKey, string> = {
  Answer: "answer", Summarize: "summarize", Extract: "extract", Classify: "classify",
  Decide: "recommend", Monitor: "detect", Generate: "generate", Orchestrate: "automate",
};

// Words that never make a good "flavor" (too generic to characterize the ask).
const STOP = new Set((
  "a an the to for of our my your their his her we i us it its that this these those and or but with without in on at by from into over under as is are be being been can could would should will shall may might must do does did done make makes made get gets got give gives use uses using used help helps need needs want wants wish hope like more less most least very really just so they them then than there here what which who whom whose how why when where all any each every some no not new old good bad better best faster slow slower quick quickly easily team teams people user users customer customers employee employees staff thing things stuff way ways across within around about".split(/\s+/)
));
const INTENT_WORDS = /^(answer|answers|answering|summari\w*|route|routing|classif\w*|categor\w*|detect\w*|flag\w*|monitor\w*|extract\w*|draft\w*|writ\w*|generat\w*|compos\w*|recommend\w*|suggest\w*|decid\w*|resolve\w*|automat\w*|search\w*|find\w*|retriev\w*|fix\w*|reduce\w*|cut|improve\w*|handle\w*)$/;
// A good flavor is a noun/adjective, not a verb. Reject obvious verbs so we don't
// get phrasings like "the evaluate documents".
const VERBISH = /(?:ate|ize|ise|ify)$/;
const COMMON_VERBS = new Set(
  "evaluate manage process handle review track improve increase reduce build create deliver provide ensure enable resolve respond reply streamline optimize accelerate identify analyze analyse simplify scale boost drive lower raise speed".split(/\s+/),
);

export interface AmbitionSignal {
  object: string;       // the thing acted on — from the question, else the job
  flavor: string;       // a distinctive qualifier from the ask (fraud, onboarding…) or ""
  verb: string;         // intent verb, driven by the Job dropdown
  noun: string;         // intent noun
  intentKey: string;
  matchedObject: boolean;
}

export function analyzeAmbition(raw: string, job: JobKey): AmbitionSignal {
  const text = (raw || "").toLowerCase();

  const found = DOMAIN_NOUNS
    .filter((n) => new RegExp(`\\b${n.replace(/\s+/g, "\\s+")}\\b`).test(text))
    .sort((a, b) => b.length - a.length)[0];

  // flavor: the most distinctive content word, excluding the object & generic words.
  const objWords = new Set((found || "").split(/\s+/));
  const tokens = text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const flavor =
    tokens
      .filter((w) => w.length > 3 && !STOP.has(w) && !objWords.has(w) && !INTENT_WORDS.test(w) && !VERBISH.test(w) && !COMMON_VERBS.has(w))
      .sort((a, b) => b.length - a.length)[0] || "";

  const intentKey = JOB_INTENT[job] ?? "answer";
  const info = INTENT_INFO[intentKey] ?? INTENT_INFO.answer;

  return {
    object: found || JOB_NOUN[job],
    flavor,
    verb: info.verb,
    noun: info.noun,
    intentKey,
    matchedObject: !!found,
  };
}
