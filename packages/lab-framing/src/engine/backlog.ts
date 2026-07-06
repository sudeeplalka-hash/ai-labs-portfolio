// ============================================================================
// Backlog generator. Instead of fixed slots, every bucket draws from a POOL of
// relevance-scored idea archetypes. Selection is seeded by every parameter AND
// the full text of the ask, so any change, a dropdown or a single word, re-ranks
// which ideas surface, while relevance weighting keeps the most fitting ones up
// top. Deterministic and offline.
// ============================================================================
import type { FramingParams, UseCase, BucketKey } from "./types";
import { clamp } from "./scoring";
import { analyzeAmbition } from "./analyze";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const singular = (s: string) => (s.endsWith("ies") ? s.slice(0, -3) + "y" : s.endsWith("ss") ? s : s.endsWith("s") ? s.slice(0, -1) : s);

// Stable [0,1) hash so each archetype gets deterministic noise from the seed,
// independent of iteration order.
function hashFloat(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
  return (h >>> 0) / 4294967296;
}

interface Ctx {
  u: string; us: string; obj: string; objS: string;
  verb: string; verbCap: string; noun: string; flavor: string;
  pain: string; intentKey: string; poorData: boolean;
}

interface Arch {
  id: string;
  bucket: BucketKey;
  rel: (c: Ctx) => number;     // relevance 0..1; < 0 excludes it
  title: (c: Ctx) => string;
  desc: (c: Ctx) => string;
  v: number; e: number;        // base value / effort
}

const POOL: Arch[] = [
  // ── Wins ──────────────────────────────────────────────────────────────────
  { id: "w-common", bucket: "Wins", v: 68, e: 30,
    rel: (c) => 0.55 + (["answer", "route", "flag", "summarize"].includes(c.intentKey) ? 0.2 : 0),
    title: (c) => `${c.verbCap} the most common ${c.obj} automatically`,
    desc: (c) => `Cover the top repeat ${c.obj} for ${c.u} where the answer already exists. Fast to ship.` },
  { id: "w-top", bucket: "Wins", v: 64, e: 26,
    rel: () => 0.5,
    title: (c) => `A quick win: ${c.verb} the top ${c.obj}`,
    desc: (c) => `A narrow, high frequency slice of ${c.obj}. Easy for ${c.u} to trust on day one.` },
  { id: "w-selfserve", bucket: "Wins", v: 66, e: 32,
    rel: (c) => 0.45 + (c.pain === "Poor experience" || c.pain === "Too slow" ? 0.2 : 0),
    title: (c) => `Let ${c.u} self-serve the everyday ${c.obj}`,
    desc: (c) => `Hand ${c.u} a fast, self-service path for routine ${c.obj}, no waiting in a queue.` },
  { id: "w-deflect", bucket: "Wins", v: 67, e: 30,
    rel: (c) => 0.45 + (c.pain === "Hard to scale" || c.pain === "Too expensive" ? 0.25 : 0),
    title: (c) => `Deflect repetitive ${c.obj} before they reach a person`,
    desc: (c) => `Take routine ${c.obj} off the team's plate so ${c.u} only handle the exceptions.` },
  { id: "w-instant", bucket: "Wins", v: 65, e: 28,
    rel: (c) => 0.4 + (c.pain === "Too slow" ? 0.35 : 0),
    title: (c) => `Instant first response on every ${c.objS}`,
    desc: (c) => `Cut the wait for ${c.u} with an immediate, useful first reply.` },
  { id: "w-flavor", bucket: "Wins", v: 66, e: 31,
    rel: (c) => (c.flavor ? 0.6 : -1),
    title: (c) => `Catch the ${c.flavor} ${c.obj} first`,
    desc: (c) => `Prioritize the ${c.flavor} cases of ${c.obj} that matter most to ${c.u}.` },

  // ── Core ──────────────────────────────────────────────────────────────────
  { id: "c-grounded", bucket: "Core", v: 74, e: 52,
    rel: () => 0.55,
    title: (c) => `Grounded ${c.noun} backed by your sources`,
    desc: (c) => `${c.verbCap} ${c.obj} with citations ${c.u} can verify, drawn from your own content.` },
  { id: "c-intool", bucket: "Core", v: 71, e: 48,
    rel: () => 0.5,
    title: (c) => `Built into the tools ${c.u} already use`,
    desc: (c) => `Bring ${c.obj} into the workflow ${c.u} live in and cut the context switching.` },
  { id: "c-human", bucket: "Core", v: 70, e: 50,
    rel: (c) => 0.45 + (c.pain === "Error prone" ? 0.25 : 0),
    title: (c) => `${c.verbCap} ${c.obj} with a human in the loop`,
    desc: (c) => `Draft automatically, let ${c.u} approve, and learn from every edit.` },
  { id: "c-consistent", bucket: "Core", v: 72, e: 47,
    rel: (c) => 0.4 + (c.pain === "Inconsistent" ? 0.4 : 0),
    title: (c) => `One consistent ${c.verb} for every ${c.objS}`,
    desc: (c) => `Standardize responses so ${c.u} stop getting different answers each time.` },
  { id: "c-search", bucket: "Core", v: 73, e: 50,
    rel: (c) => 0.4 + (c.pain === "Knowledge trapped" || c.intentKey === "search" ? 0.4 : 0),
    title: (c) => `Make ${c.obj} knowledge searchable for ${c.u}`,
    desc: (c) => `Surface what is already known instead of making ${c.u} hunt for it.` },
  { id: "c-flavor", bucket: "Core", v: 72, e: 50,
    rel: (c) => (c.flavor ? 0.52 : -1),
    title: (c) => `A ${c.flavor}-aware assistant for ${c.obj}`,
    desc: (c) => `Tuned to the ${c.flavor} specifics of your ${c.obj}, not a generic bot.` },

  // ── Differentiators ─────────────────────────────────────────────────────────
  { id: "d-proactive", bucket: "Differentiators", v: 82, e: 74,
    rel: () => 0.5,
    title: (c) => `A proactive layer that gets ahead of ${c.obj}`,
    desc: () => "Move from reactive to proactive, acting before anyone has to ask. The hard, defensible bet." },
  { id: "d-agent", bucket: "Differentiators", v: 85, e: 80,
    rel: (c) => 0.5 + (c.intentKey === "automate" ? 0.3 : 0),
    title: (c) => `An agent that resolves ${c.obj} end to end`,
    desc: () => "Closes the loop instead of only suggesting. Highest ceiling, highest effort." },
  { id: "d-predict", bucket: "Differentiators", v: 80, e: 72,
    rel: (c) => 0.4 + (c.pain === "Hard to scale" || c.pain === "Impossible today" ? 0.3 : 0),
    title: (c) => `Predict the next ${c.objS} before it lands`,
    desc: (c) => `Anticipate demand and prepare ${c.u} ahead of time, not after the fact.` },
  { id: "d-personalize", bucket: "Differentiators", v: 79, e: 70,
    rel: () => 0.4,
    title: (c) => `Personalized ${c.noun} tuned to each ${c.us}`,
    desc: (c) => `Adapt to each ${c.us}'s history and context instead of one-size-fits-all.` },
  { id: "d-flavor", bucket: "Differentiators", v: 84, e: 76,
    rel: (c) => (c.flavor ? 0.55 : -1),
    title: (c) => `Own the ${c.flavor} problem end to end`,
    desc: (c) => `Make ${c.flavor} ${c.obj} a capability competitors cannot easily match.` },

  // ── Foundations ─────────────────────────────────────────────────────────────
  { id: "f-unify", bucket: "Foundations", v: 46, e: 55,
    rel: (c) => 0.5 + (c.poorData ? 0.2 : 0),
    title: (c) => `Unify and clean the ${c.obj} sources`,
    desc: () => "The fuel. Pull together the scattered data this depends on." },
  { id: "f-eval", bucket: "Foundations", v: 42, e: 44,
    rel: (c) => 0.45 + (c.pain === "Error prone" ? 0.3 : 0),
    title: () => `An evaluation harness with guardrails`,
    desc: (c) => `Measure accuracy on real ${c.obj} and contain failures before anyone trusts it.` },
  { id: "f-feedback", bucket: "Foundations", v: 40, e: 38,
    rel: () => 0.4,
    title: () => `A feedback loop that learns from corrections`,
    desc: (c) => `Turn every ${c.u} correction on ${c.obj} into a training signal.` },
  { id: "f-taxonomy", bucket: "Foundations", v: 44, e: 50,
    rel: (c) => 0.35 + (c.poorData ? 0.3 : 0),
    title: (c) => `A shared taxonomy and metadata for ${c.obj}`,
    desc: (c) => `Make ${c.obj} consistent and findable across teams.` },
  { id: "f-cost", bucket: "Foundations", v: 48, e: 42,
    rel: (c) => 0.35 + (c.pain === "Too expensive" ? 0.4 : 0),
    title: (c) => `Cache and route ${c.obj} by difficulty to cut cost`,
    desc: (c) => `Serve the easy ${c.obj} cheaply and reserve spend for the hard ones.` },
  { id: "f-audit", bucket: "Foundations", v: 43, e: 46,
    rel: () => 0.32,
    title: (c) => `A review and audit trail for ${c.obj}`,
    desc: (c) => `Log every decision on ${c.obj} so it can be checked and trusted later.` },
];

const ORDER: BucketKey[] = ["Wins", "Core", "Differentiators", "Foundations"];
const COUNT: Record<BucketKey, number> = { Wins: 2, Core: 2, Differentiators: 2, Foundations: 3 };

export function generateBacklog(p: FramingParams, ambition = ""): UseCase[] {
  const sig = analyzeAmbition(ambition, p.job);
  const poorData = p.posture === "Sparse" || p.posture === "Unstructured";
  const ctx: Ctx = {
    u: p.user.toLowerCase(), us: singular(p.user.toLowerCase()),
    obj: sig.object, objS: singular(sig.object),
    verb: sig.verb, verbCap: cap(sig.verb), noun: sig.noun, flavor: sig.flavor,
    pain: p.pain, intentKey: sig.intentKey, poorData,
  };

  // Seed selection on EVERY parameter and the full normalized ask, so any change
  // re-ranks the pool. Relevance keeps the fitting ideas up top; noise breaks ties
  // and reshuffles comparable options.
  const seed = [p.user, p.job, p.pain, p.posture, p.risk, (ambition || "").toLowerCase().replace(/\s+/g, " ").trim()].join("|");
  const noise = (id: string) => hashFloat(`${seed}|${id}`);

  // risk re-weight (value pts)
  const rw: Partial<Record<BucketKey, number>> =
    p.risk === "Conservative" ? { Wins: 10, Differentiators: -16 }
    : p.risk === "Aggressive" ? { Wins: -8, Differentiators: 16 }
    : {};

  let id = 0;
  const out: UseCase[] = [];
  for (const bucket of ORDER) {
    const ranked = POOL
      .filter((a) => a.bucket === bucket && a.rel(ctx) >= 0)
      .map((a) => ({ a, score: a.rel(ctx) + 0.6 * noise(a.id) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, COUNT[bucket]);

    for (const { a } of ranked) {
      let value = a.v + Math.round((noise(`${a.id}|v`) - 0.5) * 16);
      let effort = a.e + Math.round((noise(`${a.id}|e`) - 0.5) * 14);
      if (rw[bucket]) value += rw[bucket] as number;
      if (poorData && bucket === "Foundations") { effort += 10; value += 8; }
      if (poorData && (bucket === "Core" || bucket === "Differentiators")) effort += 8;
      out.push({
        id: id++,
        bucket,
        title: cap(a.title(ctx)),
        desc: a.desc(ctx),
        value: clamp(value, 20, 95),
        effort: clamp(effort, 15, 92),
      });
    }
  }
  return out;
}
