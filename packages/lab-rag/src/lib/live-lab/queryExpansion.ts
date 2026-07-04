import { contentWords } from "./textUtils";

// Lightweight, deterministic synonym expansion so BM25 can bridge common
// vocabulary gaps (e.g. "founded" vs the document's "origin / started").
const EXPANSIONS: { triggers: string[]; add: string[] }[] = [
  { triggers: ["found", "founded", "founder", "founders", "start", "started", "establish", "established", "create", "created", "origin", "begin", "began"], add: ["origin", "founder", "founded", "started", "established", "began", "launched", "cofounder", "created", "team"] },
  { triggers: ["money", "revenue", "profit", "profitable", "earn", "income", "monetize", "monetise", "funding", "fund", "raise", "raised"], add: ["customers", "pay", "paid", "sales", "revenue", "subscription", "funding", "invest", "investor", "price", "fee", "clients", "profitable"] },
  { triggers: ["purpose", "goal", "objective", "aim", "mission", "about"], add: ["goal", "objective", "purpose", "aim", "mission", "vision"] },
  { triggers: ["cost", "price", "fee", "charge", "expensive", "pricing"], add: ["cost", "price", "fee", "charge", "pricing", "expense"] },
  { triggers: ["leader", "ceo", "lead", "run", "manage", "head", "director"], add: ["ceo", "founder", "led", "manager", "director", "head", "lead"] },
  { triggers: ["problem", "issue", "challenge", "drawback", "difficulty", "risk"], add: ["problem", "issue", "challenge", "drawback", "difficulty", "obstacle", "risk"] },
  { triggers: ["customer", "client", "clients", "customers", "user", "users"], add: ["customer", "client", "user", "buyer", "first"] },
  { triggers: ["product", "software", "tool", "platform", "solution", "offering", "service"], add: ["product", "software", "platform", "tool", "solution", "technology", "model"] },
  { triggers: ["grow", "growth", "scale", "expand", "expansion"], add: ["growth", "scale", "expand", "expansion", "develop"] },
  { triggers: ["compete", "competitor", "competition", "rival"], add: ["competitor", "competition", "rival", "market"] },
  { triggers: ["when", "date", "year", "time"], add: ["year", "date"] },
  { triggers: ["where", "location", "located", "based"], add: ["location", "based", "headquarters", "country", "city"] },
];

export function expandQuery(query: string): string[] {
  const words = new Set(contentWords(query).map((w) => w.replace(/[^a-z0-9]/g, "")));
  const ql = query.toLowerCase();
  const extra = new Set<string>();
  for (const { triggers, add } of EXPANSIONS) {
    if (triggers.some((t) => ql.includes(t))) {
      for (const a of add) if (!words.has(a)) extra.add(a);
    }
  }
  return [...extra];
}
