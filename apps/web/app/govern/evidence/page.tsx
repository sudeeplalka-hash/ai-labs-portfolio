'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CopyButton } from '@labs/design-system';
import { caseHref } from '@gov/lib/navigation';
import { useRole, can, roleLabel } from '@gov/lib/rbac';
import { api } from '@gov/lib/api';
import type { EvidenceReport } from '@gov/lib/types';
import { StatusBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { formatDate, formatReportingDate } from '@gov/lib/utils';
import { FileText, Download, Plus } from 'lucide-react';

export default function EvidenceCenter() {
  const [reports, setReports] = useState<EvidenceReport[]>([]);
  const [selected, setSelected] = useState<EvidenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [caseId, setCaseId] = useState('');
  const role = useRole();
  const mayGenerate = can(role, 'evidence:generate');
  const [form, setForm] = useState({ title: 'AI Governance Audit Evidence', generated_by: 'ai-governance@corp.example.com', period_start: '2026-01-01', period_end: '2026-06-30' });
  const updateField = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    const contextCase = new URLSearchParams(window.location.search).get('case') || '';
    setCaseId(contextCase);
    api.evidence.list().then(d => { if (!current) return; setReports([...d]); if (d.length) setSelected(d.find(report => report.source_case_ids?.includes(contextCase)) ?? d[0]); }).catch(() => { if (current) setError('Evidence reports could not load.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mayGenerate || generating) return;
    if (form.period_start > form.period_end) { setError('The period end must be on or after its start.'); return; }
    setGenerating(true);
    setError(''); setReceipt('');
    try {
      const r = await api.evidence.create({ ...form, period_start: new Date(`${form.period_start}T00:00:00.000Z`).toISOString(), period_end: new Date(`${form.period_end}T23:59:59.999Z`).toISOString(), sections: ['risk_posture', 'policies', 'runtime', 'evals', 'human_review', 'audit'] });
      setReports(prev => [r, ...prev.filter(report => report.id !== r.id)]);
      setSelected(r);
      setShowForm(false);
      setReceipt(`Draft generated: ${r.title}. Reporting period ${formatReportingDate(r.period_start)} to ${formatReportingDate(r.period_end)} (UTC). Review its source records and missing evidence before export.`);
    } catch { setError('The evidence draft could not be generated. Your inputs are preserved; retry when ready.'); }
    finally { setGenerating(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Compliance</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Audit Evidence Center</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} disabled={!mayGenerate} aria-expanded={showForm} aria-controls="evidence-form" aria-describedby={!mayGenerate ? 'evidence-role-note' : undefined} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Plus size={16} /> Generate Report
        </button>
      </div>
      {caseId && <p className="text-sm text-slate-600">Investigation started from <Link href={caseHref(caseId)} className="text-primary underline">case {caseId}</Link>. Reports cover the registry snapshot; confirm the source IDs below before treating a report as evidence for this case.</p>}
      {!mayGenerate && <p id="evidence-role-note" className="text-sm text-slate-500">{roleLabel(role)} can read reports. Generating an evidence draft requires Risk &amp; Audit or Administrator.</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={() => setAttempt((value) => value + 1)} className="underline">Reload reports</button></p>}
      {receipt && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{receipt}</p>}

      {showForm && (
        <form id="evidence-form" onSubmit={generate} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">New Evidence Report</h3>
          <p className="text-sm text-slate-600">The period filters event and review creation dates in UTC. Case and policy configuration is a current snapshot. Missing evaluation or audit evidence remains explicit.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['title', 'Report Title'], ['generated_by', 'Generated By (email)'], ['period_start', 'Period Start'], ['period_end', 'Period End']].map(([k, label]) => (
              <div key={k}>
                <label htmlFor={`evidence-${k}`} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                <input id={`evidence-${k}`} name={k} type={k.includes('period') ? 'date' : k === 'generated_by' ? 'email' : 'text'} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={(form as Record<string, string>)[k]} onChange={e => updateField(k, e.currentTarget.value)} onInput={k.includes('period') ? e => updateField(k, e.currentTarget.value) : undefined} required />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={generating || !mayGenerate} className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{generating ? 'Generating…' : 'Generate draft'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 px-3 py-2">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">Reports</div>
          <div className="divide-y divide-slate-100">
            {reports.map(r => (
              <button key={r.id} aria-pressed={selected?.id === r.id} onClick={() => setSelected(r)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${selected?.id === r.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-800 flex-1 text-left">{r.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                </div>
                <div className="mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-0.5">
                    <span>{r.coverage_note ? 'Section coverage' : 'Reported completeness'}</span><span>{r.completeness_score}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${r.completeness_score}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{selected.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Period: {formatReportingDate(selected.period_start)} to {formatReportingDate(selected.period_end)} (UTC)</p>
                </div>
                <a href={api.evidence.downloadUrl(selected.id)} download className="flex items-center gap-1.5 text-xs border border-slate-200 px-3 py-1.5 rounded text-slate-600 hover:bg-slate-50">
                  <Download size={13} /> Download .md
                </a>
              </div>
              <p className="mb-4 text-sm text-slate-600">Source: {selected.source_mode || 'Embedded or API-provided report snapshot'}. {selected.coverage_note || 'Its reported completeness does not certify that controls passed. Source IDs were not retained for older report snapshots.'}</p>
              <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3 xl:grid-cols-5">
                {[['Use Cases', selected.use_case_count], ['Policies', selected.policy_count], ['Events', selected.prompt_event_count], ['Eval Runs', selected.eval_run_count], ['Reviews', selected.review_item_count]].map(([k, v]) => (
                  <div key={k} className="text-center bg-slate-50 rounded p-2">
                    <p className="text-lg font-bold text-slate-800">{v}</p>
                    <p className="text-xs text-slate-500">{k}</p>
                  </div>
                ))}
              </div>
              {selected.source_case_ids?.length ? <nav aria-label="Report source cases" className="border-t border-slate-100 pt-3"><p className="mb-2 text-sm font-semibold">Source cases in this snapshot</p><ul className="space-y-1">{selected.source_case_ids.map(id => <li key={id}><Link href={caseHref(id)} className="break-all text-xs text-primary underline">{id}</Link></li>)}</ul></nav> : <p className="text-sm text-slate-500">This snapshot does not retain case-level source identifiers. <Link href="/govern/use-cases" className="text-primary underline">Inspect the current registry</Link> before using it as case-specific evidence.</p>}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Report Preview</p>
              <div className="mb-3"><CopyButton text={selected.content_markdown} label="Copy report" /></div>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 rounded p-4 max-h-96 overflow-y-auto">{selected.content_markdown}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
