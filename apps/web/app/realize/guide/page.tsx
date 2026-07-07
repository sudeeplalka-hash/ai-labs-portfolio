import type { Metadata } from "next";
import { TrendingUp, Coins, GitBranch, SlidersHorizontal, Banknote, FileText } from "lucide-react";
import { LabGuide } from "@/components/shell/LabGuide";

export const metadata: Metadata = { title: "Guide · Realize" };

export default function Page() {
  return (
    <LabGuide
      stage="How this lab works"
      title="Realize, in plain terms"
      icon={TrendingUp}
      intro="This is the payoff: a risk adjusted business case where every number traces back to a real decision upstream. It starts from the value the AI could create, subtracts the honest leaks, and lands on the figure a CFO would actually sign off on."
      steps={[
        { icon: Coins, title: "Start from addressable value", body: "Annual tasks the AI can touch, times the time saved per task, times the labor rate.", why: "Value starts with how much real work the system can actually take off people's plates." },
        { icon: GitBranch, title: "Subtract the leaks", body: "Take out what's lost to low adoption, imperfect answer quality, run cost, and a risk discount.", why: "Gross value is fantasy, the leaks are where the real return lands, and they're visible in the Value River." },
        { icon: Banknote, title: "Trace every number", body: "Each input is inherited from an upstream lab: readiness from Data, quality from Build, run cost from AI Ops, risk tier from Govern.", why: "A business case you can defend is one where every figure has a source, not a guess." },
        { icon: SlidersHorizontal, title: "Test the assumptions", body: "Override adoption, answer quality, minutes saved, or investment and watch the sensitivity bars react.", why: "Know which lever moves ROI the most before you commit a budget to it." },
        { icon: TrendingUp, title: "Read the verdict", body: "Risk adjusted value per year, ROI, payback period, and three year NPV.", why: "This is the single read on whether the initiative is worth funding." },
        { icon: FileText, title: "The initiative dossier", body: "The whole program on one page, every number linked to the stage it came from, ready to hand a stakeholder.", why: "It's the artifact that turns analysis into an actual decision." },
      ]}
      closing="Realize answers the only question that ultimately matters: is it worth it?"
      closingIcon={TrendingUp}
    />
  );
}
