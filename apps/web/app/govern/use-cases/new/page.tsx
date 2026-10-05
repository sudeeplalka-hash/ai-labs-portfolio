'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@gov/lib/api';
import type { UseCase } from '@gov/lib/types';
import { useRole, can, roleLabel } from '@gov/lib/rbac';
import { caseHref } from '@gov/lib/navigation';
import { USE_CASE_MODEL_OPTIONS } from '@labs/kit';

const FIELD_OPTIONS = {
  business_function: ['Finance', 'HR', 'Legal', 'Operations', 'Customer'],
  deployment_context: ['internal', 'customer-facing', 'agentic'],
  data_sensitivity: ['public', 'internal', 'confidential', 'regulated'],
  human_oversight: ['always', 'required', 'optional', 'none'],
  use_case_type: ['assistant', 'rag', 'agentic', 'classifier'],
  ai_model: USE_CASE_MODEL_OPTIONS,
};
const STEP_LABELS = ['Purpose and owner', 'Risk context', 'Review and register'];

export default function NewUseCase() {
  const [form, setForm] = useState({ name: '', description: '', business_function: 'Finance', owner: '', owner_email: '', ai_model: 'gpt-4o', deployment_context: 'internal', data_sensitivity: 'internal', human_oversight: 'required', use_case_type: 'assistant' });
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<UseCase | null>(null);
  const role = useRole();
  const mayCreate = can(role, 'usecase:create');
  const update = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mayCreate || loading) return;
    if (step < 2) { setStep(step + 1); return; }
    setLoading(true); setError('');
    try { setSaved(await api.useCases.create(form)); }
    catch { setError('Registration did not complete. Your entries are still here; retry when ready.'); }
    finally { setLoading(false); }
  };
  return <div className="max-w-3xl space-y-5 p-4 sm:p-8">
    <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Use case registry</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Register an AI use case</h2><p className="mt-2 text-sm text-slate-600">Capture its purpose, owner and risk context, then inspect the resulting drivers and required controls.</p></div>
    {!mayCreate && <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">The {roleLabel(role)} role can read the registry. Registration requires AI Analyst or Administrator. The sidebar role selector demonstrates these permissions.</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {saved ? <section aria-label="Registration receipt" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <h3 role="status" className="font-semibold text-emerald-900">Registered: {saved.name}</h3>
      <p className="mt-2 text-sm">Risk tier {saved.risk_tier} · score {saved.risk_score.toFixed(3)} · {saved.required_controls.length} required controls.</p>
      <p className="mt-2 break-all font-mono text-xs">Case ID: {saved.id}</p>
      <p className="mt-2 text-sm">{process.env.NEXT_PUBLIC_STATIC_DEMO === '1' ? 'This is a browser-session record. Refreshing the app resets sample-registry changes.' : 'The governance API confirmed this record.'} Registration does not approve a deployment.</p>
      <Link href={caseHref(saved.id)} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-white">Inspect risk drivers and controls</Link>
    </section> : <>
      <ol aria-label="Registration progress" className="flex flex-wrap gap-2 text-sm">{STEP_LABELS.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={`rounded-full border px-3 py-2 ${index === step ? 'border-primary bg-primary-soft text-primary' : 'border-slate-200 text-slate-600'}`}>{index + 1}. {label}</li>)}</ol>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={!mayCreate || loading} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 disabled:opacity-60">
          <legend className="px-2 font-semibold">{STEP_LABELS[step]}</legend>
          {step === 0 && <>
            {(['name', 'description', 'owner', 'owner_email'] as const).map(key => <div key={key}><label htmlFor={`case-${key}`} className="mb-1 block text-sm font-medium capitalize">{key.replaceAll('_', ' ')}</label>{key === 'description' ? <textarea id={`case-${key}`} value={form[key]} onChange={event => update(key, event.target.value)} required className="min-h-24 w-full rounded-lg border border-slate-300 p-2 text-sm" /> : <input id={`case-${key}`} type={key === 'owner_email' ? 'email' : 'text'} value={form[key]} onChange={event => update(key, event.target.value)} required className="w-full rounded-lg border border-slate-300 p-2 text-sm" />}</div>)}
          </>}
          {step === 1 && <div className="grid gap-4 sm:grid-cols-2">{Object.entries(FIELD_OPTIONS).map(([key, options]) => <div key={key}><label htmlFor={`case-${key}`} className="mb-1 block text-sm font-medium capitalize">{key.replaceAll('_', ' ')}</label><select id={`case-${key}`} value={(form as Record<string, string>)[key]} onChange={event => update(key, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm">{options.map(option => <option key={option} value={option}>{option}</option>)}</select></div>)}</div>}
          {step === 2 && <><p className="text-sm text-slate-600">Confirm the inputs below. The risk score and controls are derived after registration; this step does not authorize release.</p><dl className="space-y-2">{Object.entries(form).map(([key, value]) => <div key={key} className="grid gap-1 border-b border-slate-100 pb-2 sm:grid-cols-[160px_1fr]"><dt className="text-sm capitalize text-slate-500">{key.replaceAll('_', ' ')}</dt><dd className="break-words text-sm text-slate-800">{value}</dd></div>)}</dl></>}
        </fieldset>
        <div className="flex flex-wrap gap-3">
          {step > 0 && <button type="button" disabled={loading} onClick={() => setStep(step - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Back</button>}
          <button type="submit" disabled={!mayCreate || loading} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Registering…' : step < 2 ? 'Continue' : 'Register and score'}</button>
          <Link href="/govern/use-cases" className="rounded-lg px-3 py-2 text-sm text-slate-600 underline">Return to registry</Link>
        </div>
      </form>
    </>}
  </div>;
}
