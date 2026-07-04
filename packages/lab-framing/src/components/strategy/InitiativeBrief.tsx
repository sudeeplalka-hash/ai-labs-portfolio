"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Save, Copy, ArrowRight, Check, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { cn } from "@labs/design-system";
import type { Brief, Scored } from "../../strategy/model";

function briefToText(b: Brief): string {
  return [
    `AI INITIATIVE BRIEF — ${b.name}`,
    ``,
    `Business problem: ${b.problem}`,
    `Target users: ${b.users}`,
    `Business outcome: ${b.outcome}`,
    `Baseline: ${b.baseline}`,
    `Target: ${b.target}`,
    `AI pattern: ${b.pattern}`,
    `Primary data sources: ${b.dataSources}`,
    ``,
    `Key risks:`,
    ...b.risks.map((r) => `  - ${r}`),
    `Required controls:`,
    ...b.controls.map((c) => `  - ${c}`),
    `Required gates:`,
    ...b.gates.map((g) => `  [${g.passed ? "x" : " "}] ${g.label}`),
    ``,
    `Strategy readiness: ${b.score}/100`,
    `Recommendation: ${b.recommendation}`,
    `Next step: ${b.nextStep}`,
  ].join("\n");
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 sm:flex-row sm:gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slatey-500 sm:w-40">{label}</span>
      <span className="flex-1 text-sm text-ink">{children}</span>
    </div>
  );
}

export function InitiativeBrief({ brief, scored, onSave }: { brief: Brief; scored: Scored; onSave: () => void }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const canContinue = scored.gatesPassed;

  const save = () => { onSave(); setSaved(true); };
  const copy = async () => { try { await navigator.clipboard.writeText(briefToText(brief)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ } };

  return (
    <section id="brief" className="scroll-mt-24 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.05] to-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark"><FileText className="h-3.5 w-3.5" /> AI Initiative Brief</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">{brief.name}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink ring-1 ring-inset ring-line">
          <span className="font-mono">{brief.score}</span><span className="text-slatey-400">/100</span>
        </span>
      </div>

      <div className="mt-4">
        <Row label="Business problem">{brief.problem}</Row>
        <Row label="Target users">{brief.users}</Row>
        <Row label="Business outcome">{brief.outcome}</Row>
        <Row label="Baseline → target"><span className="text-slatey-400">{brief.baseline}</span> → <b className="text-ink">{brief.target}</b></Row>
        <Row label="AI pattern">{brief.pattern}</Row>
        <Row label="Primary data">{brief.dataSources}</Row>
        <Row label="Key risks">
          {brief.risks.length ? <ul className="list-disc space-y-0.5 pl-4 text-slatey-300">{brief.risks.map((r, i) => <li key={i}>{r}</li>)}</ul> : "None flagged"}
        </Row>
        <Row label="Required controls">
          <span className="flex flex-wrap gap-1.5">
            {brief.controls.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><ShieldCheck className="h-3 w-3" />{c}</span>)}
          </span>
        </Row>
        <Row label="Required gates">
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {brief.gates.map((g) => (
              <span key={g.key} className="inline-flex items-center gap-1 text-[11px]">
                {g.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-400" />}
                <span className="text-slatey-400">{g.label}</span>
              </span>
            ))}
          </span>
        </Row>
        <Row label="Recommendation"><b className="text-ink">{brief.recommendation}</b></Row>
        <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slatey-500 sm:w-40">Next step</span>
          <span className="flex-1 text-sm text-slatey-300">{brief.nextStep}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} className={cn("inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors", saved ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" : "bg-primary text-white shadow-glow hover:bg-primary-dark")}>
          {saved ? <><Check className="h-4 w-4" /> Saved to program</> : <><Save className="h-4 w-4" /> Save to Program</>}
        </button>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-slatey-300 hover:bg-slate-50">
          {copied ? <><Check className="h-4 w-4 text-emerald-500" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Brief</>}
        </button>
        {canContinue ? (
          <Link href="/data" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">
            Continue to Data Lab <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="text-xs text-slatey-500">Resolve required gates to continue to the Data Lab.</span>
        )}
      </div>
    </section>
  );
}
