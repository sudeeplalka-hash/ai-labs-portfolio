"use client";

// GAP-04 · Tool use & Structured Output (Collection 2 · toolkit).
// Messy text → schema-validated JSON. A hard sample fails validation (wrong type /
// missing required), triggers a corrective retry, and passes, the trace is the
// point. Where outputs feed a system of record, the validation gate is not optional.
// Authored illustrative outputs only; no model endpoint is called.

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, XCircle, CheckCircle2, Database } from "lucide-react";
import { InstrumentShell, usePlayback, useInViewport, DecisionSummary, Provenance, Panel, Badge, LiveBadge, FreshnessStamp, InsightCard } from "@labs/design-system";
import { ExplanationControls, EvidenceTable, CodeEvidence } from "./AgentExperience";
import { GAP04_USE_CASES } from "@labs/kit";
import { UseCaseRail, UseCaseBrief } from "../use-case/UseCaseRail";
import { CaseStudy } from "../reviewer/CaseStudy";
import { OutcomeFrame } from "../reviewer/OutcomeFrame";
import { useUseCaseDeepLink } from "../use-case/useDeepLink";

interface Field { name: string; type: string; required: boolean }
interface Sample {
  key: string; label: string; raw: string; schema: Field[];
  hard: boolean; attempt1?: object; errors?: string[]; retryNote?: string; final: object;
}

const SAMPLES: Sample[] = [
  {
    key: "dispute", label: "Dispute email", hard: false,
    raw: "Hi, this is really frustrating, I've been a cardmember for years. There's a charge for $214.50 from 'GLOBEX DIGITAL' on the account ending 0021 that I absolutely did not make. I've called twice. Please open a dispute. Unacceptable.",
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
    retryNote: "Re prompt with the schema + the three errors: null unknown numerics, include every required key, and flag missing identifiers for human follow up.",
    final: { intent: "status", account_id: null, amount_usd: null, sentiment: "negative", priority: "med", needs_followup: true, summary: "Member reports possible unrecognized charges (~$50, unconfirmed); no account number provided, route to follow up." },
  },
  {
    key: "timeoff", label: "Time off request", hard: false,
    raw: "Hey, I'd like to take next Mon to Fri (Aug 4 to 8) off for a family trip, that's 5 days. My ID is EMP-3391. Can my manager get a heads up? Thanks!",
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

// SIMULATED, extractions are authored/deterministic; a live-model variant is on the roadmap (no live call path is wired today).

export function StructuredOutput() {
  const [key, setKey] = useState(SAMPLES[0].key);
  const [activeUcId, setActiveUcId] = useState<string | null>(null);
  const activeUc = activeUcId ? GAP04_USE_CASES.find((u) => u.id === activeUcId) ?? null : null;
  useUseCaseDeepLink(GAP04_USE_CASES.map((u) => u.id), (id) => selectUseCase(id));
  const s: Sample = activeUc
    ? { key: activeUc.id, label: activeUc.payload.label, raw: activeUc.payload.raw, schema: activeUc.payload.schema, hard: activeUc.payload.hard, attempt1: activeUc.payload.attempt1, errors: activeUc.payload.errors, retryNote: activeUc.payload.retryNote, final: activeUc.payload.final }
    : SAMPLES.find((x) => x.key === key)!;
  const [text, setText] = useState(s.raw);
  const [ran, setRan] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageVisible = useInViewport(stageRef, "0px");
  const playback = usePlayback({ steps: s.hard ? 3 : 1, intervalMs: 1700, initiallyComplete: false, visible: stageVisible });
  const changedFields = s.attempt1 ? Object.keys(s.final).filter((field) => JSON.stringify((s.attempt1 as Record<string, unknown>)[field]) !== JSON.stringify((s.final as Record<string, unknown>)[field])) : [];
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const onSample = (k: string) => { setKey(k); setActiveUcId(null); setText(SAMPLES.find((x) => x.key === k)!.raw); setRan(false); playback.reset(); setSelectedField(null); setNotice(""); };
  const selectUseCase = (id: string | null) => {
    setActiveUcId(id);
    const uc = id ? GAP04_USE_CASES.find((u) => u.id === id) : null;
    setText(uc ? uc.payload.raw : SAMPLES[0].raw);
    if (!uc) setKey(SAMPLES[0].key);
    setRan(false); playback.reset(); setSelectedField(null); setNotice("");
  };
  const edited = text.trim() !== s.raw.trim();

  return (
    <InstrumentShell title="Structured Output Reliability Gate" eyebrow="GAP-04 · Agent architecture" description="Follow one authored output from a schema failure to a corrected field."
      breadcrumbs={[{ label: "Portfolio", href: "/" }, { label: "Agent architecture", href: "/#collections" }, { label: "Structured Output Reliability Gate" }]}
      provenance={<Provenance mode="SIMULATED" input={activeUc ? activeUc.title : "Default illustrative scenario"} method="Authored extraction; no live model or record write" note="Illustrative results support review; they do not establish a production outcome." />}>
        <DecisionSummary title={s.hard ? "A failed field must be repaired before the gate opens" : "This authored output passes the supplied schema"} explanation="Inspect the exact fields and validation errors. Editing source text does not run a model, and no record is written." metrics={[{ label: "Schema fields", value: s.schema.length }, { label: "Changed fields in retry", value: changedFields.length }, { label: "Source state", value: edited ? "Custom draft · not extracted" : "Supplied example" }]} />
        <UseCaseRail useCases={GAP04_USE_CASES} activeId={activeUcId} onSelect={selectUseCase} />
        {activeUc && <UseCaseBrief useCase={activeUc} />}
        <CaseStudy problem="Enterprise systems cannot absorb malformed writes because a model response looked plausible. Structured output requires schema validation, error handling, corrective retry, and a clear decision about when to stop automation and escalate." approach="The artifact runs representative tasks through a schema validation workflow. It shows where raw model output fails, how a corrective retry repairs it, and what tradeoff the retry introduces." why="This connects model behavior to operational reliability, auditability, downstream system integrity, and the cost of failed automation." metric="Schema valid rate at the gate; repair success rate; escapes downstream." tradeoff="A strict gate adds retries and latency; a loose one lets bad data write to systems of record." outcome="A clear answer on where to place the validation gate and how strict to make it." />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {!activeUc && SAMPLES.map((x) => (
            <button key={x.key} aria-pressed={x.key === key} onClick={() => onSample(x.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${x.key === key ? "border-teal-600 bg-teal-600 text-white" : "border-line bg-white text-slatey-400 hover:border-teal-500/40 hover:text-ink"}`}>{x.label}{x.hard && " ⚠"}</button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input + schema */}
          <div className="space-y-4">
            <Panel>
              <p className="stat-label mb-2">Raw input</p>
              <textarea aria-label="Source text for authored extraction example" value={text} onChange={(e) => { setText(e.target.value); setRan(false); playback.pause(); }} rows={5} className="w-full rounded-lg border border-line bg-white p-2.5 text-xs text-slatey-300 outline-none focus:border-teal-500/50" />
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => { if (edited) { setNotice("This viewer cannot extract custom text. Your draft is kept; restore the supplied example to inspect its authored result."); return; } setNotice(""); setRan(true); playback.replay(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Inspect example <ArrowRight className="h-3.5 w-3.5" /></button>
                {edited && <button type="button" className="min-h-11 rounded border border-line px-3 text-xs font-semibold" onClick={() => { setText(s.raw); setRan(false); playback.reset(); setNotice(""); }}>Restore example text</button>}
              </div><p role="status" className="mt-2 text-sm text-amber-800">{notice}</p>
            </Panel>
            <Panel>
              <p className="stat-label mb-2">Target schema</p>
              <ul className="space-y-1 font-mono text-[11px]">
                {s.schema.map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-2 border-b border-line pb-1 last:border-0">
                    <button type="button" aria-pressed={selectedField === f.name} className={`min-h-11 rounded px-2 text-left font-semibold ${selectedField === f.name ? "bg-primary text-white" : "text-ink"}`} onClick={() => { playback.pause(); setSelectedField(f.name); }}>{f.name}</button>
                    <span className="text-slatey-500">{f.type}{f.required && <span className="ml-1 text-rose-500">*</span>}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slatey-500"><span className="text-rose-500">*</span> required key must be present (nullable where typed).</p>
            </Panel>
          </div>

          {/* Trace */}
          <div className="space-y-3" ref={stageRef}>
            {ran && <ExplanationControls playback={playback} count={s.hard ? 3 : 1} label="Authored schema validation" />}
            {selectedField && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"><p className="font-semibold">Field: {selectedField}</p><p>First attempt: {JSON.stringify((s.attempt1 as Record<string, unknown> | undefined)?.[selectedField]) ?? "not supplied separately"}</p><p>Accepted example: {JSON.stringify((s.final as Record<string, unknown>)[selectedField]) ?? "absent"}</p></div>}
            {!ran ? (
              <Panel><p className="text-sm text-slatey-500">Select Inspect example to inspect the supplied extraction. Custom drafts are never presented as extracted output.</p></Panel>
            ) : (
              <>
                {s.hard && s.attempt1 && (
                  <>
                    {playback.index >= 1 && <AttemptCard n={1} valid={false} json={s.attempt1} errors={s.errors} />}
                    {playback.index >= 2 && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><span className="font-semibold">Corrective retry:</span> {s.retryNote}</div>}
                    {playback.index >= 3 && <AttemptCard n={2} valid json={s.final} />}
                  </>
                )}
                {!s.hard && playback.index >= 1 && <AttemptCard n={1} valid json={s.final} />}
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

        <details className="mt-4 rounded-xl border border-line bg-white p-4"><summary className="cursor-pointer font-semibold">Read the complete supplied field comparison</summary><EvidenceTable caption="Authored extraction values — not an extraction of edited text" headers={["Field", "First attempt", "Accepted example", "Change"]} rows={s.schema.map((field) => [field.name, JSON.stringify((s.attempt1 as Record<string, unknown> | undefined)?.[field.name]) ?? "No separate attempt", JSON.stringify((s.final as Record<string, unknown>)[field.name]) ?? "Absent", changedFields.includes(field.name) ? "Repaired" : "Unchanged / first pass"]) } /></details>
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          <OutcomeFrame call="Place a validation gate before any model output writes to a system of record." lift="Raises system ready output reliability through schema enforcement and corrective retry." measure="Validation pass rate, retry rate, failed write prevention, latency added, escalation rate." />
          <InsightCard title="The retry is the reliability" tone="info">
            The first pass is often almost-right, a string where a number belongs, a missing key. A validation gate with a
            single corrective retry turns &ldquo;usually valid&rdquo; into &ldquo;always valid or explicitly flagged.&rdquo; That&apos;s the
            difference between a demo and production.
          </InsightCard>
          <p className="text-sm leading-relaxed text-ink"><span className="font-semibold">Steering committee takeaway:</span> {activeUc ? activeUc.takeaway : "If model output updates a system of record, validation is not optional. It is a reliability control."}</p>
          <details className="rounded-lg border border-line bg-white p-4 text-sm text-slatey-300">
            <summary className="cursor-pointer font-semibold text-ink">How this is built</summary>
            <div className="mt-2 space-y-1 text-xs leading-relaxed">
              <p>Each sample targets a JSON schema (typed, nullable, required keys). The output is validated key by key; on failure the errors are fed back in a corrective retry and re validated.</p>
              <p>Extractions are authored and deterministic (not live model output); the hard sample&apos;s first attempt is constructed to fail schema validation so the corrective retry is visible. A live model variant is designed for but not wired today, so the badge stays SIMULATED.</p>
              <p>Stack: Next.js (static) + shared design system; client side.</p>
            </div>
          </details>
          <p className="text-xs text-slatey-500"><span className="font-semibold text-slatey-400">Limitations:</span> this model demonstrates validation behavior with authored tasks. Production use would require real schema contracts, logging, retry policies, exception handling, and system integration.</p>
        </div>
    </InstrumentShell>
  );
}

function AttemptCard({ n, valid, json, errors }: { n: number; valid: boolean; json: object; errors?: string[] }) {
  return (
    <div className={`rounded-xl border p-3 ${valid ? "border-emerald-300 bg-white" : "border-rose-200 bg-rose-50"}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        {valid ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
        <p className={`text-xs font-semibold ${valid ? "text-emerald-700" : "text-rose-700"}`}>Attempt {n} · {valid ? "valid, passes the gate" : "invalid, blocked"}</p>
      </div>
      <CodeEvidence title={`Attempt ${n} JSON`} value={json} />
      {errors && errors.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-rose-700">
          {errors.map((e, i) => <li key={i} className="flex gap-1.5"><span>✕</span><span className="font-mono">{e}</span></li>)}
        </ul>
      )}
    </div>
  );
}
