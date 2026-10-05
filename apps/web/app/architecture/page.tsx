import { routeMetadata, BUILD_ID } from "@/lib/site";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContractLoop, SimulationBoundary } from "@/components/reviewer/Reviewer";

export const metadata = routeMetadata("Architecture and implementation", "Inspect the static application architecture, lifecycle contracts and explicit simulation boundaries.", "/architecture");

const ARCH = [
  "Next.js 14 App Router, static export (no server runtime)",
  "pnpm + Turborepo monorepo: one app composing domain lab packages",
  "ProgramProvider shared state (apcc_state) persisted in localStorage",
  "Client side deterministic engines per stage: no backend, no API key required",
  "Static / demo data fallback so every lab works standalone",
];
const REAL = [
  "Strategy scoring, capability tags, and recommended build path",
  "Data readiness handoff derivation",
  "RAG lab logic: chunking, retrieval, evidence, evaluations, quality gates",
  "Operate evidence engine: release readiness, lineage, monitoring, regression, incidents",
  "Governance decision engine: scorecard, controls, findings, audit pack",
  "Agent and tool calling mechanics: schemas, permission boundaries, approvals, misuse evals",
  "Training and fine tuning readiness: decision memo, dataset readiness, overfitting and generalization",
  "Realize ROI engine: leakage, risk discount, payback, NPV",
];

const CONTRACTS = [
  { name: "Data readiness", from: "Data → Build", href: "/data/corpus", fields: ["approvedSources / blockedSources", "ingestionReadyPercent", "sensitivityRestrictions", "remediationEntries"], effect: "Source decisions constrain retrieval and remain visible in downstream evidence." },
  { name: "Evaluated build", from: "Build → Deploy / Operate", href: "/build", fields: ["selectedModel / retrievalMode", "evalRunId / datasetVersion", "failedGates / knownFailureModes", "costEstimate / latencyEstimateMs"], effect: "The evaluated configuration carries its failed gates and release recommendation with it." },
  { name: "Operational evidence", from: "Deploy / Operate → Govern", href: "/operate", fields: ["sloStatus / driftRisk", "versionLineage", "regressionFindings", "rollbackReadiness / incidentSummary"], effect: "Quality and operational signals support a reviewable release decision." },
  { name: "Governance decision", from: "Govern → Realize", href: "/govern", fields: ["tier / decision", "evidenceUsed / releaseBlockers", "approvalConditions / owner", "nextReviewDate / auditReadiness"], effect: "Open risk and approval conditions remain attached when assessing value." },
];

export default function Page() {
  return (
    <div className="space-y-8">
      <header>
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-slatey-400 hover:text-primary"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <p className="eyebrow mt-2">Implementation notes</p>
        {/* <h2>: the AppShell Header owns this page's <h1>. */}
        <h2 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Architecture &amp; how it&rsquo;s built</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slatey-300">
          The portfolio and its command-center variant share one application that demonstrates enterprise AI
          delivery mechanics without confidential data or cloud infrastructure.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-white p-5 shadow-card">
        <p className="eyebrow">Architecture overview</p>
        <ul className="mt-2 space-y-1.5 text-sm text-slatey-300">{ARCH.map((a) => <li key={a} className="flex gap-2"><span className="text-primary">▸</span>{a}</li>)}</ul>
      </section>

      <ContractLoop />
      <section aria-labelledby="contract-inspector"><h3 id="contract-inspector" className="text-xl font-semibold text-ink">Inspect a handoff contract</h3><p className="mt-2 text-sm text-slatey-400">Open a stage to see the source-backed field names, why the contract matters and where to inspect the producing instrument.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{CONTRACTS.map((contract) => <details key={contract.name} className="rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold text-ink">{contract.name}<span className="mt-1 block text-xs font-normal text-slatey-500">{contract.from}</span></summary><p className="mt-3 text-sm text-slatey-400">{contract.effect}</p><ul className="mt-3 space-y-2 text-xs">{contract.fields.map((field) => <li key={field} className="break-words rounded bg-slate-50 p-2 font-mono text-ink">{field}</li>)}</ul><Link href={contract.href} className="mt-3 inline-block text-sm font-medium text-primary underline">Open the producing instrument</Link></details>)}</div><p className="mt-3 text-xs text-slatey-500">Contracts defined in the shared program-core model. Build identity: {BUILD_ID}. Contract fields describe the data shape; they do not certify production integrations.</p></section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-card">
        <p className="eyebrow">What is real logic</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 text-sm text-slatey-300">{REAL.map((a) => <li key={a} className="flex gap-2"><span className="text-emerald-600">●</span>{a}</li>)}</ul>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-card">
        <p className="eyebrow">Where model internals sit</p>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slatey-300">
          The Command Center doesn&rsquo;t replace model development frameworks. It sits above them as a lifecycle and governance layer.
          Model internals (transformers, attention, embeddings, fine tuning) matter because they shape the build path, evaluation strategy,
          operating risk, and governance burden. <Link href="/build/internals" className="text-primary hover:underline">See the Under the Hood explainer →</Link>
        </p>
        <div className="mt-3 space-y-1.5">
          {[
            { l: "Model internals", d: "transformers, attention, embeddings" },
            { l: "Build substrate", d: "prompting, RAG, retrieval, fine tuning, tools" },
            { l: "Operating layer", d: "release readiness, lineage, monitoring, incidents" },
            { l: "Governance layer", d: "controls, findings, evidence, decisions" },
            { l: "Business layer", d: "adoption, ROI, leakage, risk adjusted value" },
          ].map((r, i) => (
            <div key={r.l} className={"flex flex-wrap items-center gap-3 rounded-lg border border-line p-2.5 " + (i === 4 ? "bg-primary/[0.05]" : "bg-slate-50/50")}>
              <span className="font-mono text-[11px] text-slatey-500">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-semibold text-ink">{r.l}</span>
              <span className="text-[12px] text-slatey-400">{r.d}</span>
            </div>
          ))}
        </div>
      </section>

      <SimulationBoundary />

      <section className="rounded-xl border border-primary/25 bg-primary/[0.04] p-5">
        <p className="eyebrow text-primary-dark">Why this is intentional</p>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slatey-300">
          The product is a portfolio command center designed to show enterprise AI delivery mechanics without using confidential
          data or requiring cloud infrastructure. The architecture is deliberately organized around handoff contracts, so real
          integrations (vector DB, telemetry, eval stores) can replace modeled signals without reworking the lifecycle.
        </p>
        <Link href="/roadmap" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">See the product roadmap →</Link>
      </section>
    </div>
  );
}
