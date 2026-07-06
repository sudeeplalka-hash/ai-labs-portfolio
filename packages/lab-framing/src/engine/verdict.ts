// ============================================================================
// Verdict + insights. The judgment is the hero: a short, honest read of the bet,
// plus three cards, what is strong, what to watch, and what comes next.
// ============================================================================
import type { FramingParams, TriangleScores, Verdict, VerdictTone } from "./types";
import { SCORE_TARGETS } from "./scoring";

export function deriveVerdict(p: FramingParams, sc: TriangleScores): Verdict {
  const min = Math.min(sc.value, sc.feasibility, sc.dataReadiness);
  const humanReview =
    (p.risk === "Aggressive" && (sc.feasibility < 45 || sc.dataReadiness < 45)) ||
    sc.dataReadiness < 35;

  let tone: VerdictTone, headline: string, detail: string;
  if (sc.dataReadiness === min && sc.dataReadiness < 50) {
    tone = "watch";
    headline = "Data is the bottleneck";
    detail = "Worth wanting, but the data is not ready yet. Expect the Data stage to test this readiness estimate.";
  } else if (sc.feasibility === min && sc.feasibility < 45) {
    tone = "risk";
    headline = "Aimed too wide";
    detail = "Real pull, but the scope is too broad for how hard the job is. Tighten the scope and feasibility climbs.";
  } else if (sc.value < 50) {
    tone = "info";
    headline = "Safe but small";
    detail = "Easy to build and trust, yet the payoff is modest. Widen the slice or pick a sharper pain.";
  } else if (sc.value >= SCORE_TARGETS.value && sc.feasibility >= 55 && sc.dataReadiness >= 55) {
    tone = "healthy";
    headline = "A balanced bet";
    detail = "Worth doing, buildable, and your data can feed it. This is the one to carry into the Data stage.";
  } else {
    tone = "info";
    headline = "Live tension";
    detail = "Widening the scope trades feasibility and readiness for value. Watching that trade play out is the whole point.";
  }
  return { tone, headline, detail, humanReview };
}

export interface Insight {
  tone: "success" | "warn" | "danger" | "info";
  title: string;
  body: string;
}

export function deriveInsights(p: FramingParams, sc: TriangleScores): Insight[] {
  const out: Insight[] = [];

  const top = (["value", "feasibility", "dataReadiness"] as const).reduce((a, b) => (sc[a] >= sc[b] ? a : b));
  const topLabel = top === "value" ? "Value" : top === "feasibility" ? "Feasibility" : "Data readiness";
  out.push({
    tone: "success",
    title: `Strongest right now: ${topLabel} (${sc[top]})`,
    body:
      top === "value" ? "The pain is real and the audience is broad. There is a prize here worth chasing."
      : top === "feasibility" ? "Scope and difficulty are in a buildable range. This can ship without heroics."
      : "Your data can support this job. The fuel is the least of your worries.",
  });

  const low = (["value", "feasibility", "dataReadiness"] as const).reduce((a, b) => (sc[a] <= sc[b] ? a : b));
  const lowLabel = low === "value" ? "Value" : low === "feasibility" ? "Feasibility" : "Data readiness";
  out.push({
    tone: sc[low] < 45 ? "danger" : "warn",
    title: `Keep an eye on: ${lowLabel} (${sc[low]})`,
    body:
      low === "value" ? "The payoff is thin for the effort. Sharpen the pain or widen the audience before committing."
      : low === "feasibility" ? "Scope or difficulty is pushing this out of reach. Tighten the first slice."
      : `Your "${p.posture}" data may not hold up in the Data stage. Plan for a readiness gap.`,
  });

  out.push({
    tone: "info",
    title: "What comes next: Data",
    body: `The Data stage checks this ${sc.dataReadiness} out of 100 readiness estimate against your real "${p.posture}" sources. It is the first real test.`,
  });

  return out;
}
