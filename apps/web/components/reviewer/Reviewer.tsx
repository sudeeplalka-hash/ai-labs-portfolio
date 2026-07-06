// Phase 8, reviewer-facing positioning components. Pure/presentational (no
// hooks), so they work in both server pages (/roadmap, /architecture) and the
// client Home. Reused across the reviewer surfaces.

import Link from "next/link";
import {
  Compass, Database, Boxes, Rocket, ShieldCheck, TrendingUp, ArrowRight, PlayCircle, Cpu,
  Briefcase, Wrench, Gavel, ClipboardList, CircleCheck, CircleDot, type LucideIcon,
} from "lucide-react";

// ---- Start here: the program loop ------------------------------------------
const LOOP: { icon: LucideIcon; stage: string; line: string; href: string }[] = [
  { icon: Compass, stage: "Strategy", line: "creates the initiative.", href: "/frame" },
  { icon: Database, stage: "Data", line: "decides what can be trusted.", href: "/data" },
  { icon: Boxes, stage: "Build / RAG", line: "evaluates the AI system.", href: "/build" },
  { icon: Rocket, stage: "Operate", line: "monitors release readiness and production risk.", href: "/deploy" },
  { icon: ShieldCheck, stage: "Govern", line: "approves, restricts, or blocks release.", href: "/govern" },
  { icon: TrendingUp, stage: "Realize", line: "proves value and loops learning back.", href: "/realize" },
];

export function StartHereLoop() {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 sm:p-6">
      <p className="eyebrow text-primary-dark">Start here</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">See the AI program loop</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-300">
        Walk through how an AI idea becomes a governed, measurable program. The Command Center follows one initiative across
        Strategy, Data, Build/RAG, Operate, Govern, and Realize, so you can see the decisions, risks, controls, and business
        value at each stage.
      </p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LOOP.map((s, i) => (
          <li key={s.stage}>
            <Link href={s.href} className="flex items-start gap-2.5 rounded-lg border border-line bg-white p-3 transition-shadow hover:shadow-card">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"><s.icon className="h-4 w-4" /></span>
              <span className="text-sm leading-snug text-slatey-300"><b className="text-ink">{i + 1}. {s.stage}</b> {s.line}</span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/frame" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-primary-dark"><PlayCircle className="h-4 w-4" /> Start the guided loop</Link>
        <Link href="/build" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-slatey-300 hover:bg-slate-50"><Cpu className="h-4 w-4" /> Jump to technical depth</Link>
      </div>
    </div>
  );
}

// ---- Reviewer modes ---------------------------------------------------------
const MODES: { icon: LucideIcon; title: string; focus: string; path: string; href: string; cta: string }[] = [
  { icon: Briefcase, title: "Executive reviewer", focus: "Business value, governance, risk, and ROI.", path: "Story → Strategy → Govern → Realize", href: "/story", cta: "View executive path" },
  { icon: Wrench, title: "Technical reviewer", focus: "RAG pipeline, traces, evaluations, quality gates, and AI Ops evidence.", path: "Build/RAG → Traces → Evaluations → Quality Gates → Operate", href: "/build", cta: "View technical path" },
  { icon: Gavel, title: "Governance reviewer", focus: "Risk tiering, controls, evidence, findings, and audit trail.", path: "Govern → Data sensitivity → Build quality gates → Audit evidence", href: "/govern", cta: "View governance path" },
  { icon: ClipboardList, title: "Product / TPM reviewer", focus: "Lifecycle, handoffs, release gates, risks, and measurable outcomes.", path: "Strategy → Data → Operate → Govern → Realize", href: "/frame", cta: "View product path" },
];

export function ReviewerModes() {
  return (
    <div>
      <p className="stat-label mb-3">Choose your reviewer path</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((m) => (
          <div key={m.title} className="flex flex-col rounded-xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 text-primary"><m.icon className="h-5 w-5" /><h3 className="text-base font-semibold text-ink">{m.title}</h3></div>
            <p className="mt-1.5 text-sm text-slatey-400">{m.focus}</p>
            <p className="mt-2 text-[12px] font-medium text-slatey-300">{m.path}</p>
            <Link href={m.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">{m.cta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- What this demonstrates -------------------------------------------------
const PROOF: { title: string; body: string }[] = [
  { title: "Enterprise AI strategy", body: "Turns vague AI ideas into scoped initiatives with capability tags, a governance tier, and a recommended build path." },
  { title: "Data readiness before build", body: "Shows AI quality depends on source ownership, metadata, PII handling, chunk readiness, and excluded data." },
  { title: "RAG evaluation maturity", body: "Retrieval, evidence, citations, faithfulness, hallucination risk, traces, golden datasets, and quality gates." },
  { title: "AI Ops / MLOps awareness", body: "Release readiness, lineage, monitoring coverage, eval regression, drift, incidents, rollback, and cost and latency." },
  { title: "Governed AI delivery", body: "Connects risk, required controls, open findings, audit evidence, and a decision to the live initiative." },
  { title: "Business value realization", body: "Adoption, leakage, run cost, risk discount, ROI, payback, and risk adjusted value." },
];

export function WhatThisDemonstrates() {
  return (
    <div>
      <p className="eyebrow">What this project demonstrates</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">How enterprise AI should be shaped, evaluated, operated, governed, and measured</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-300">
        It connects use case framing, data readiness, RAG evaluation, production readiness, governance evidence, and
        risk adjusted ROI into one traceable lifecycle. It is aware of MLOps, LLMOps, and RAGOps, without trying to
        replace a specialized ML platform.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROOF.map((p, i) => (
          <div key={i} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <h3 className="text-sm font-semibold text-ink">{p.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slatey-400">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Contract-driven loop ---------------------------------------------------
const CONTRACTS: { key: string; stage: string; contract: string; fields: string[]; tone: string }[] = [
  { key: "frame", stage: "Strategy", contract: "Strategy output", fields: ["initiative meta", "capability tags", "governance tier", "build path"], tone: "text-primary" },
  { key: "data", stage: "Data", contract: "Data Readiness Handoff", fields: ["approved sources", "blocked sources", "metadata / chunk reqs", "data risks"], tone: "text-emerald-700" },
  { key: "build", stage: "Build", contract: "Build Output Contract", fields: ["model", "retrieval mode", "eval run", "quality gates", "failure modes"], tone: "text-violet-700" },
  { key: "deploy", stage: "Deploy", contract: "Ops Evidence", fields: ["release readiness", "monitoring coverage", "regression", "incidents", "rollback"], tone: "text-amber-700" },
  { key: "govern", stage: "Govern", contract: "Governance Decision", fields: ["controls", "findings", "audit evidence", "approval status"], tone: "text-rose-700" },
  { key: "realize", stage: "Realize", contract: "Realization Dossier", fields: ["ROI", "risk adjusted value", "payback", "leakage", "next action"], tone: "text-primary-dark" },
  { key: "operate", stage: "Operate", contract: "Day Two Operations", fields: ["drift + canary decay", "value at risk", "day two incidents", "refresh/retrain trigger"], tone: "text-primary" },
];

/** Pure/presentational; `live` (optional) adds each contract's current headline
 * so the loop shows real values when a program is loaded. Server-safe. */
export function ContractLoop({ live, bare }: { live?: Partial<Record<string, string>>; bare?: boolean } = {}) {
  return (
    <div>
      {!bare && (
        <>
          <p className="eyebrow">Contract-driven</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">The program loop is contract driven</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-300">
            The stages aren&rsquo;t just visually connected. Each one emits a structured contract the next consumes through shared state.
          </p>
        </>
      )}
      <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3${bare ? "" : " mt-4"}`}>
        {CONTRACTS.map((c, i) => (
          <div key={c.stage} className="rounded-xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slatey-500">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slatey-400">{c.stage}</span>
            </div>
            <h3 className={`mt-1 text-sm font-semibold ${c.tone}`}>{c.contract}</h3>
            <ul className="mt-1.5 space-y-0.5 text-[12px] text-slatey-400">{c.fields.map((f) => <li key={f}>· {f}</li>)}</ul>
            {live?.[c.key] && (
              <p className="mt-2 rounded-md bg-primary/[0.06] px-2 py-1 text-[11px] font-semibold text-primary-dark">
                now: {live[c.key]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Simulation boundary ----------------------------------------------------
const IMPLEMENTED = [
  "Lifecycle state & handoff contracts", "Strategy scoring & build path recommendation", "Data readiness derivation",
  "RAG lab logic (chunking, retrieval, evidence, eval views)", "Operate evidence engine (readiness, lineage, monitoring, regression, incidents)",
  "Governance decision engine", "Realize ROI engine (leakage, risk discount, payback, NPV)",
];
const MODELED = [
  "Production telemetry", "Real incident history", "Observability-tool integrations", "Real vector database / ANN retrieval",
  "Real user-feedback stream", "Enterprise data connectors", "Eval run-over-run history",
];

export function SimulationBoundary() {
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-card">
      <p className="eyebrow">Simulation boundary</p>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slatey-300">
        This portfolio demo uses deterministic, client side engines and sample data to show enterprise AI delivery mechanics
        without confidential data or cloud infrastructure. Some signals, including production telemetry and incident and
        regression history, are modeled. The architecture is built around handoff contracts so real integrations can replace
        modeled signals later.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="stat-label mb-1.5 flex items-center gap-1.5 text-emerald-700"><CircleCheck className="h-4 w-4" /> Implemented / deterministic</p>
          <ul className="space-y-1 text-[13px] text-slatey-300">{IMPLEMENTED.map((x) => <li key={x} className="flex gap-1.5"><span className="text-emerald-600">●</span>{x}</li>)}</ul>
        </div>
        <div>
          <p className="stat-label mb-1.5 flex items-center gap-1.5 text-amber-700"><CircleDot className="h-4 w-4" /> Modeled / simulated</p>
          <ul className="space-y-1 text-[13px] text-slatey-300">{MODELED.map((x) => <li key={x} className="flex gap-1.5"><span className="text-amber-500">○</span>{x}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

// ---- Reviewer footer links --------------------------------------------------
export function ReviewerLinks() {
  const links = [
    { label: "Start the loop", href: "/frame" },
    { label: "Technical deep dive", href: "/build" },
    { label: "Governance evidence", href: "/govern" },
    { label: "Realize value", href: "/realize" },
    { label: "Architecture & notes", href: "/architecture" },
    { label: "Product roadmap", href: "/roadmap" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-slate-50/60 px-4 py-3 text-sm">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="inline-flex items-center gap-1 font-medium text-slatey-300 hover:text-primary">{l.label} <ArrowRight className="h-3.5 w-3.5" /></Link>
      ))}
    </div>
  );
}

// ---- Concise stage "what this demonstrates" note ----------------------------
export function StageDemonstrates({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50/50 px-4 py-2.5 text-[13px] leading-relaxed text-slatey-400">
      <span className="font-semibold text-slatey-300">What this stage demonstrates: </span>{children}
    </div>
  );
}
