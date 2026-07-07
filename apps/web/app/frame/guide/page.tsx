import type { Metadata } from "next";
import { Compass, Sparkles, Wand2, Layers, Target, Gauge, Flag } from "lucide-react";
import { LabGuide } from "@/components/shell/LabGuide";

export const metadata: Metadata = { title: "Guide · Strategy & Planning" };

export default function Page() {
  return (
    <LabGuide
      stage="How this lab works"
      title="Strategy & Planning, in plain terms"
      icon={Compass}
      intro="This is where a vague 'we should use AI' becomes one specific bet you can actually build and measure. You make a few choices, the lab sharpens them into a clear problem, generates options, and scores the trade offs, so you leave with a scoped, falsifiable initiative, not a wish."
      steps={[
        { icon: Sparkles, title: "Say the ambition", body: "Type what you wish AI could do, then make five quick choices: who it's for, the job, the pain, your data posture, and your risk appetite.", why: "A fuzzy wish can't be built or measured. These choices turn it into something concrete." },
        { icon: Wand2, title: "Sharpen it", body: "The lab rewrites your ambition into one clear, testable problem statement focused on the narrowest valuable slice.", why: "A sharp problem is half the solution, it sets the scope and the success bar." },
        { icon: Layers, title: "See the options", body: "It generates a spread of ideas across four buckets, Quick wins, Core, Differentiators, and Foundations, each placed by value and effort.", why: "The first idea is rarely the best bet. Comparing options keeps you from over or under reaching." },
        { icon: Target, title: "Score the bet", body: "Value, feasibility, and data readiness are scored together. Drag the scope and watch them trade off against each other.", why: "These three move as one, widening scope buys value but costs feasibility and readiness. Seeing that trade is the whole point." },
        { icon: Flag, title: "Set a target you could miss", body: "Define a falsifiable success metric: a baseline, a target, and the coverage it applies to.", why: "If you can't fail it, it isn't a real goal, and you'll never know if the bet paid off." },
        { icon: Gauge, title: "Save the initiative", body: "The framed bet threads forward into Data, Build, AI Ops, Govern, and Realize.", why: "Every number in the final business case traces back to the decisions you make here." },
      ]}
      closing="Framing turns 'we should use AI' into a bet you can actually run, measure, and defend."
      closingIcon={Compass}
    />
  );
}
