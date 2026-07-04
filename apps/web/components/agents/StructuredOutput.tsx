"use client";

// GAP-04 · Tool-Use & Structured Output (Collection 2 · toolkit).
// Messy text → schema-validated JSON. A hard sample fails validation (wrong type /
// missing required), triggers a corrective retry, and passes — the trace is the
// point. Where outputs feed a system of record, the validation gate is not optional.
// LIVE-ready (host endpoint → real model); ships deterministic + honestly badged.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, XCircle, CheckCircle2, Database } from "lucide-react";
import { Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { GAP04_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";

interface Field { name: string; type: string; required: boolean }
interface Sample {
  key: string; label: string; raw: string; schema: Field[];
  hard: boolean; attempt1?: object; errors?: string[]; retryNote?: string; final: object;
}

const SAMPLES: Sample[] = [
  {
    key: "dispute", label: "Dispute email", hard: false,
    raw: "Hi, this is really frustrating — I've been a cardmember for years. There's a charge for $214.50 from 'GLOBEX DIGITAL' on the account ending 0021 that I absolutely did not make. I've called twice. Please open a dispute. Unacceptable.",
    schema: [
      { name: "intent", type: "enum(open_dispute|status|general)", required: true },
      { name: "account_id", type: "string|null", required: true },
      { name: "amount_usd", type: "number|null", required: true },
      { name: "sentiment", type: "enum(positive|neutral|negative)", required: true },
      { name: "priority", type: "enum(low|med|high)", required: true },
      { name: "summary", type: "string", required: true },
    ],
    final: { intent: "open_dispute", account_id: "ACCT-0021", amount_usd: 214.5, sentiment: "negative", priority: "high", summary: "Cardmember disputes a $214.50 charge from GLOBEX DIGITAL; wants a dispute opened." },
  },
  {
    key: "ambiguous", label: "Ambiguous complaint (hard)", hard: true,
    raw: "yeah so there were like a couple weird charges maybe? not sure the exact amount, somewhere around fifty bucks each i think, on my account but i don't have the number handy. kinda annoyed tbh. can someone look into it",
    schema: [
      { name: "intent", type: "enum(open_dispute|status|general)", required: true },
      { name: "account_id", type: "string|null", required: true },
      { name: "amount_usd", type: "number|null", required: true },
      { name: "sentiment", type: "enum(positive|neutral|negative)", required: true },
      { name: "priority", type: "enum(low|med|high)", required: true },
      { name: "needs_followup", type: "boolean", required: true },
      { name: "summary", type: "string", required: true },
    ],
    attempt1: { intent: "status", amount_usd: "around 50", sentiment: "negative", priority: "med", summary: "Member reports possible unrecognized charges around $50." },
    errors: ["account_id: required key missing", "amount_usd: expected number|null, got string \"around 50\"", "needs_followup: required key missing"],
    retryNote: "Re-prompt with the schema + the three errors: null unknown numerics, include every required key, and flag missing identifiers for human follow-up.",
    final: { intent: "status", account_id: null, amount_usd: null, sentiment: "negative", priority: "med", needs_followup: true, summary: "Member reports possible unrecognized charges (~$50, unconfirmed); no account number provided — route to follow-up." },
  },
  {
    key: "timeoff", label: "Time-off request", hard: false,
    raw: "Hey, I'd like to take next Mon–Fri (Aug 4–8) off for a family trip — that's 5 days. My ID is EMP-3391. Can my manager get a heads up? Thanks!",
    schema: [
      { name: "employee_id", type: "string", required: true },
      { name: "days", type: "number", required: true },
      { name: "start_date", type: "string (ISO)", required: true },
      { name: "reason", type: "enum(vacation|sick|personal)", required: true },
      { name: "notify_manager", type: "boolean", required: true },
    ],
    final: { employee_id: "EMP-3391", days: 5, start_date: "2026-08-04", reason: "vacation", notify_manager: true },
  },
];

// SIMULATED — extractions are authored/deterministic; a live-model variant is on the roadmap (no live call path is wired today).

export function StructuredOutput() {
  const [key, setKey] = useState(SAMPLES[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP04_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  const s: Sample = activeUc
    ? { key: activeUc.id, label: activeUc.payload.label, raw: activeUc.payload.raw, schema: activeUc.payload.schema, hard: activeUc.payload.hard, attempt1: activeUc.payload.attempt1, errors: activeUc.payload.errors, retryNote: activeUc.payload.retryNote, final: activeUc.payload.final }
    : SAMPLES.find((x) => x.key === key)!;
  const [text, setText] = useState(s.raw);
  const [ran, setRan] = useState(false);

  const onSample = (k: string) => { setKey(k); setActiveUcId(null); setText(SAMPLES.find((x) => x.key === k)!.raw); setRan(false); };
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP04_USE_CASES.find((u) => u.id === id) : null;
    setText(uc ? uc.payload.raw : SAMPLES[0].raw);
    setRan(false);
  };
  const edited = text.trim() !== s.raw.trim();

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">GAP-04</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <div className="mb-5">
          <p className="eyebrow mb-1">Agent &amp; Protocol · Toolkit</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Tool-Use &amp; Structured Output</h1>
            <LiveBadge mode="SIMULATED" />
            <FreshnessStamp freshness={{ lastVerified: "2026-07-02", note: "Authored illustrative extraction" }} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">
            Getting JSON out of a model is easy. Getting <span className="font-semibold text-ink">valid</span> JSON, every
            time, into a system of record is reliability engineering — schema, validation, and a corrective retry.
          </p>
        </div>

        <UseCaseRail useCases={GAP04_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {!activeUc && SAMPLES.map((x) => (
            <button key={x.key} onClick={() => onSample(x.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${x.key === key ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{x.label}{x.hard && " ⚠"}</button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input + schema */}
          <div className="space-y-4">
            <Panel>
              <p className="stat-label mb-2">Raw input</p>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-lg border border-line bg-white p-2.5 text-xs text-slatey-300 outline-none focus:border-teal-500/50" />
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => setRan(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Extract <ArrowRight className="h-3.5 w-3.5" /></button>
                {edited && <span className="text-[11px] text-slatey-500">Extractions are authored per sample; custom text would need a live model (roadmap).</span>}
              </div>
            </Panel>
            <Panel>
              <p className="stat-label mb-2">Target schema</p>
              <ul className="space-y-1 font-mono text-[11px]">
                {s.schema.map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-2 border-b border-line pb-1 last:border-0">
                    <span className="text-ink">{f.name}</span>
                    <span className="text-slatey-500">{f.type}{f.required && <span className="ml-1 text-rose-500">*</span>}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slatey-500"><span className="text-rose-500">*</span> required key must be present (nullable where typed).</p>
            </Panel>
          </div>

          {/* Trace */}
          <div className="space-y-3">
            {!ran ? (
              <Panel><p className="text-sm text-slatey-500">Press Extract to run the sample through the schema gate.</p></Panel>
            ) : (
              <>
                {s.hard && s.attempt1 && (
                  <>
                    <AttemptCard n={1} valid={false} json={s.attempt1} errors={s.errors} />
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800"><span className="font-semibold">Corrective retry:</span> {s.retryNote}</div>
                    <AttemptCard n={2} valid json={s.final} />
                  </>
                )}
                {!s.hard && <AttemptCard n={1} valid json={s.final} />}
              </>
            )}

            {/* Validation gate diagram */}
            <Panel>
              <p className="stat-label mb-2">Where the gate sits</p>
              <div className="flex items-center justify-between gap-2 text-center text-[11px]">
                <div className="flex-1 rounded-md border border-line p-2"><p className="font-semibold text-ink">Model</p><p className="text-slatey-500">raw JSON</p></div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slatey-500" />
                <div className="flex-1 rounded-md border border-teal-300 bg-teal-50 p-2"><ShieldCheck className="mx-auto mb-0.5 h-4 w-4 text-teal-700" /><p className="font-semibold text-teal-700">Validate</p><p className="text-teal-700/80">schema + retry</p></div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slatey-500" />
                <div className="flex-1 rounded-md border border-line p-2"><Database className="mx-auto mb-0.5 h-4 w-4 text-ink" /><p className="font-semibold text-ink">System of record</p><p className="text-slatey-500">only valid passes</p></div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <InsightCard title="The retry is the reliability" tone="info">
            The first pass is often almost-right — a string where a number belongs, a missing key. A validation gate with a
            single corrective retry turns "usually valid" into "always valid or explicitly flagged." That&apos;s the
            difference between a demo and production.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering-committee takeaway:</span> {activeUc ? activeUc.takeaway : "Where outputs feed systems of record, the validation gate is not optional. I place it between the model and the write."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each sample targets a JSON schema (typed, nullable, required keys). The output is validated key-by-key; on failure the errors are fed back in a corrective retry and re-validated.</p>
              <p>Extractions are authored and deterministic (not live model output); the hard sample&apos;s first attempt is constructed to fail schema validation so the corrective retry is visible. A live-model variant is designed for but not wired today, so the badge stays SIMULATED.</p>
              <p>Stack: Next.js (static) + shared design system; client-side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> the extractions are authored illustrations, not live model output; custom text needs a live model (roadmap). Real deployments add a max-retry cap and a dead-letter path for repeated failures.</p>
        </div>
      </main>
    </div>
  );
}

function AttemptCard({ n, valid, json, errors }: { n: number; valid: boolean; json: object; errors?: string[] }) {
  return (
    <div className={`rounded-xl border p-3 ${valid ? "border-emerald-300 bg-white" : "border-rose-200 bg-rose-50"}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        {valid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
        <p className={`text-xs font-semibold ${valid ? "text-emerald-700" : "text-rose-700"}`}>Attempt {n} · {valid ? "valid — passes the gate" : "invalid — blocked"}</p>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-[11px] leading-relaxed text-slate-100">{JSON.stringify(json, null, 2)}</pre>
      {errors && errors.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-rose-700">
          {errors.map((e, i) => <li key={i} className="flex gap-1.5"><span>✕</span><span className="font-mono">{e}</span></li>)}
        </ul>
      )}
    </div>
  );
}
