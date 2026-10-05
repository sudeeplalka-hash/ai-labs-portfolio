'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@gov/lib/api';
import type { UseCase } from '@gov/lib/types';
import { RiskBadge, StatusBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { formatDate, riskScoreColor } from '@gov/lib/utils';
import { Plus, Search } from 'lucide-react';
import { caseHref } from '@gov/lib/navigation';
import { useRole, can, roleLabel } from '@gov/lib/rbac';
import UseCaseDetail from './[id]/UseCaseDetail';

export default function UseCaseRegistry() {
  return <Suspense fallback={<LoadingSpinner />}><RegistryContent /></Suspense>;
}

function RegistryContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case');
  const role = useRole();
  const mayCreate = can(role, 'usecase:create');
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    api.useCases.list().then((records) => { if (current) setUseCases(records); }).catch(() => { if (current) setError('The registry could not load.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt, caseId]);

  const filtered = useCases.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.business_function.toLowerCase().includes(search.toLowerCase()) ||
    u.owner.toLowerCase().includes(search.toLowerCase())
  );

  if (caseId) return <div><Link href="/govern/use-cases" className="m-4 inline-block rounded px-3 py-2 text-sm text-primary underline">Back to registry</Link><UseCaseDetail id={caseId} /></div>;
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">AI Governance</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Use Case Registry</h2>
        </div>
        {mayCreate && <Link href="/govern/use-cases/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Register Use Case
        </Link>}
      </div>

      {!mayCreate && <p className="text-sm text-slate-500">{roleLabel(role)} has read-only registry access. Registration requires AI Analyst or Administrator.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error} <button onClick={() => setAttempt((value) => value + 1)} className="underline">Retry</button></p>}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          aria-label="Search use cases by name, function or owner"
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Search by name, function, or owner…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto" role="region" aria-label="Use case registry table" tabIndex={0}>
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Registered use cases and their modeled risk. Open a case to inspect its controls and evidence.</caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Use Case</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Function</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Score</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(uc => (
                <tr key={uc.id} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={caseHref(uc.id)} className="font-medium text-blue-600 hover:underline">{uc.name}</Link>
                    <p className="text-xs text-slate-400 mt-0.5">{uc.owner}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{uc.business_function}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{uc.use_case_type}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${riskScoreColor(uc.risk_score)}`}>{uc.risk_score.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3"><RiskBadge tier={uc.risk_tier} /></td>
                  <td className="px-4 py-3"><StatusBadge status={uc.status} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(uc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">No use cases match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
