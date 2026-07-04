import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleCheck, ArrowUpRight, Rocket, Ban } from "lucide-react";
import { SimulationBoundary } from "@/components/reviewer/Reviewer";

export const metadata: Metadata = { title: "Product Roadmap" };

const CURRENT = [
  "Six-stage AI lifecycle with shared contracts", "Strategy intake, scoring & build-path recommendation", "Data readiness handoff",
  "Build/RAG lab — retrieval modes (BM25 / vector / hybrid / re-rank)", "Agent & tool-calling mechanics (schemas, boundaries, approvals, misuse evals)",
  "Training / fine-tuning readiness — decision memo, dataset readiness, overfitting & generalization",
  "Operate / AI Ops / MLOps spine", "Govern live evidence loop & decision engine", "Realize risk-adjusted ROI engine",
  "Model-internals explainer (transformers, attention, embeddings, framework placement)",
];
const NEXT = [
  "Real vector retrieval / vector database integration", "Persistent eval run history",
  "Deeper telemetry integration", "Real tool integrations (APIs, workflow/ticketing engines)", "Real labeling tool + model registry + training pipeline integration",
  "FinOps: cost chargeback & unit-economics guardrails", "Operating model: staffing & RACI across the six stages",
  "Vendor procurement & third-party model risk workflow", "Quarterly benefits tracking (planned vs realized value)",
];
const FUTURE = [
  "External eval stores", "Observability tool integrations", "Model registry integration", "Vector DB adapter",
  "Role-based review workflows", "Exportable governance evidence pack",
];
const OUT = [
  "Real enterprise data connectors", "User authentication", "Full MLOps platform replacement", "Full model-training framework",
  "Deep PyTorch / TensorFlow notebooks", "Confidential client data", "Cloud infrastructure provisioning",
];

function Section({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: string }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}>{icon}{title}</p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 text-sm text-slatey-300">{items.map((x) => <li key={x} className="flex gap-2"><span className="text-slatey-400">·</span>{x}</li>)}</ul>
    </section>
  );
}

export default function Page() {
  return (
    <div className="space-y-6">
      <header>
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-slatey-400 hover:text-primary"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <p className="eyebrow mt-2">Product roadmap</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">What exists now, what comes next, and what&rsquo;s out of scope</h1>
      </header>

      <Section icon={<CircleCheck className="h-4 w-4 text-emerald-600" />} title="Current capabilities" items={CURRENT} tone="text-emerald-700" />
      <Section icon={<ArrowUpRight className="h-4 w-4 text-primary" />} title="Next technical upgrades" items={NEXT} tone="text-primary-dark" />
      <Section icon={<Rocket className="h-4 w-4 text-violet-600" />} title="Future production integrations" items={FUTURE} tone="text-violet-700" />
      <Section icon={<Ban className="h-4 w-4 text-slatey-400" />} title="Intentionally out of scope for now" items={OUT} tone="text-slatey-500" />

      <p className="max-w-3xl text-sm leading-relaxed text-slatey-400">
        This roadmap keeps the product focused on enterprise AI program delivery rather than turning it into a generic AI course
        or a full production platform. It intentionally does not implement a transformer or ship training notebooks — the goal is to
        demonstrate enterprise AI delivery, not to become a deep learning course.
      </p>

      <SimulationBoundary />
    </div>
  );
}
