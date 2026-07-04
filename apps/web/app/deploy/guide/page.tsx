import type { Metadata } from "next";
import { Rocket, SlidersHorizontal, Gauge, Workflow, Activity, AlertTriangle } from "lucide-react";
import { LabGuide } from "@/components/shell/LabGuide";

export const metadata: Metadata = { title: "Guide · AI Ops" };

export default function Page() {
  return (
    <LabGuide
      stage="How this lab works"
      title="AI Ops, in plain terms"
      icon={Rocket}
      intro="This is the unglamorous 70% nobody demos: running the thing reliably at a cost you can defend. You turn the dial from pilot to production and watch cost, latency, reliability, and drift react — then fire an incident and watch it recover."
      steps={[
        { icon: SlidersHorizontal, title: "Set the scale", body: "Drag the volume dial from a quiet pilot up to full production traffic.", why: "What works in a demo often breaks at scale — you need to see the system under real load." },
        { icon: Gauge, title: "Read the operating envelope", body: "Load and caching map onto colored zones for SLO and cost — safe, margin, or breaks.", why: "It shows exactly where your operating point sits and how close it is to the edge." },
        { icon: Workflow, title: "Tune and compare configs", body: "Switch model tier, caching, and reranker, and compare mixes side by side at the current scale.", why: "The cheapest compute is rarely the cheapest overall — human escalation usually dominates the bill." },
        { icon: Activity, title: "Watch the live numbers", body: "Monthly cost, reliability, p95 latency, and drift risk update as you change anything.", why: "These are the numbers an SRE and a CFO both ask about — and where Realize's run cost comes from." },
        { icon: AlertTriangle, title: "Fire an incident", body: "Inject a failure and watch alerts trip, the error budget burn, and the system recover (MTTR).", why: "Resilience is proven by how fast you recover, not by hoping nothing goes wrong." },
      ]}
      closing="AI Ops turns a working prototype into a service you can actually run without surprises."
      closingIcon={Rocket}
    />
  );
}
