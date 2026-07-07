import type { Metadata } from "next";
import { RefreshCcw, Activity, TrendingDown, AlertTriangle, GitBranch, FileDown } from "lucide-react";
import { LabGuide } from "@/components/shell/LabGuide";

export const metadata: Metadata = { title: "Guide \u00b7 Operate" };

export default function Page() {
  return (
    <LabGuide
      stage="How this lab works"
      title="Operate, in plain terms"
      icon={RefreshCcw}
      intro="Day two begins the moment you ship: the dashboards stay green while the answers quietly go stale. This lab plays out one authored incident, twelve weeks of signals, a silent-drift emergency, and the retrain / reindex / rollback / rescope call that loops the program back to Frame."
      steps={[
        { icon: Activity, title: "Read the four signal families", body: "System SLOs, the model-quality canary, RAG freshness and staleness, and agent and cost signals on one 12 week time axis.", why: "Infra health and answer quality are different things, and only one of them is on the ops dashboard by default." },
        { icon: TrendingDown, title: "Spot the silent drift", body: "Around week 5 the canary pass rate starts decaying below the Build baseline while availability and p95 stay green.", why: "This is the trap the stage exists to teach: SLOs tell you the system is up, canary evals tell you it is still right." },
        { icon: AlertTriangle, title: "Work the week 7 incident", body: "An index staleness incident lands, with blast radius, value at risk, and a projected breach of the quality floor.", why: "Value at risk turns a quality metric into money, which is what gets a remediation funded." },
        { icon: GitBranch, title: "Make the call", body: "Choose reindex, retrain, rollback, or rescope, each with its cost, time to effect, and what it does (and does not) fix.", why: "The decision is the deliverable: the right fix depends on which signal actually moved, not on which button is nearest." },
        { icon: RefreshCcw, title: "Loop it back", body: "Your decision becomes a typed feedback contract routed upstream to Frame, Build, Deploy, Realize, and Govern.", why: "This is what makes the lifecycle a loop instead of a line, day two findings become the next cycle's framing." },
        { icon: FileDown, title: "Take the artifacts", body: "Download the weekly ops review and the incident report, generated from the exact state you just produced.", why: "Ops evidence you can hand to a steering meeting beats a screenshot of a green dashboard." },
      ]}
      closing="Operate is where AI programs are won or lost after launch: catch the decay the dashboards miss, price it, fix it, and feed what you learned back into the next cycle."
      closingIcon={RefreshCcw}
    />
  );
}
