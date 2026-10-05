'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { caseContextHref } from '@gov/lib/navigation';
import { useRole, can, roleLabel } from '@gov/lib/rbac';
import { api } from '@gov/lib/api';
import type { UseCase } from '@gov/lib/types';
import { RiskBadge, StatusBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { riskScoreColor, formatDate } from '@gov/lib/utils';
import { RefreshCw, ChevronRight } from 'lucide-react';

export default function UseCaseDetail({ id }: { id: string }) {
  const [uc, setUc] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [attempt, setAttempt] = useState(0);
  const role = useRole();
  const mayRescore = can(role, 'usecase:rescore');

  useEffect(() => {
    let current = true;
    setLoading(true); setError(''); setReceipt('');
    api.useCases.get(id).then((record) => { if (current) setUc(record); }).catch(() => { if (current) setError('The case could not load. Retry to request it again.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id, attempt]);

  const rescore = async () => {
    if (!mayRescore || rescoring) return;
    setRescoring(true);
    setError(''); setReceipt('');
    try {
      const updated = await api.useCases.rescore(id);
      setUc(updated);
      setReceipt(`Rescored ${updated.name}: ${updated.risk_tier}, ${updated.risk_score.toFixed(3)}. Required controls are updated below; release approval is unchanged.`);
    } catch { setError('Rescoring did not complete. The prior case values remain visible.'); }
    finally { setRescoring(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!uc) return <div className="p-4 sm:p-8 text-sm text-slate-600">{error || 'This case is unavailable. Browser-session registrations reset on a full refresh.'} <button onClick={() => setAttempt((value) => value + 1)} className="text-primary underline">Retry</button> · <Link href="/govern/use-cases" className="text-primary underline">Return to registry</Link></div>;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Use Case Registry</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{uc.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={uc.status} />
            <RiskBadge tier={uc.risk_tier} />
            <span className={`font-mono text-sm font-semibold ${riskScoreColor(uc.risk_score)}`}>Score: {uc.risk_score.toFixed(3)}</span>
          </div>
        </div>
        <button onClick={rescore} disabled={rescoring || !mayRescore} aria-describedby={!mayRescore ? 'case-role-note' : undefined} className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded px-3 py-2 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={14} className={rescoring ? 'animate-spin' : ''} /> Rescore
        </button>
      </div>

      <p className="text-sm text-slate-600">{uc.description}</p>
      {!mayRescore && <p id="case-role-note" className="text-sm text-slate-500">{roleLabel(role)} can inspect this case. Rescoring requires AI Analyst or Administrator.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {receipt && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{receipt}</p>}
      <section className="rounded-xl border border-primary/20 bg-primary-soft p-4"><h3 className="font-semibold">Next: inspect required controls and the case&apos;s evidence</h3><p className="mt-1 text-sm text-slate-600">Risk {uc.risk_tier} describes the modeled exposure. Controls listed below are requirements, not proof that those controls have passed.</p><nav aria-label="Case investigation path" className="mt-3 flex flex-wrap gap-3 text-sm">{[['Run a check', '/govern/playground'], ['Review policies', '/govern/policies'], ['Human reviews', '/govern/review-queue'], ['Audit events', '/govern/audit-logs'], ['Evidence reports', '/govern/evidence']].map(([label, path]) => <Link key={path} href={caseContextHref(path, id)} className="rounded py-1 font-semibold text-primary underline">{label}</Link>)}</nav></section>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Configuration</h3>
          <dl className="space-y-2">
            {[
              ['Business Function', uc.business_function],
              ['Use Case Type', uc.use_case_type],
              ['AI Model', uc.ai_model],
              ['Deployment Context', uc.deployment_context],
              ['Data Sensitivity', uc.data_sensitivity],
              ['Human Oversight', uc.human_oversight],
              ['Owner', uc.owner],
              ['Owner Email', uc.owner_email],
              ['Registered', formatDate(uc.created_at)],
              ['Approved By', uc.approved_by ?? 'N/A'],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-words font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Risk Drivers</h3>
            {uc.risk_drivers.length === 0 ? (
              <p className="text-sm text-slate-400">No significant risk drivers identified.</p>
            ) : (
              <ul className="space-y-2">
                {uc.risk_drivers.map(d => (
                  <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                    <ChevronRight size={14} className="text-orange-400 shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Required Controls</h3>
            <ul className="space-y-1.5">
              {uc.required_controls.map(c => (
                <li key={c} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
