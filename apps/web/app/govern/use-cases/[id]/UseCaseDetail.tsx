'use client';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    api.useCases.get(id).then(setUc).finally(() => setLoading(false));
  }, [id]);

  const rescore = async () => {
    setRescoring(true);
    const updated = await api.useCases.rescore(id);
    setUc(updated);
    setRescoring(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!uc) return <div className="p-8 text-red-600">Use case not found.</div>;

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Use Case Registry</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{uc.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={uc.status} />
            <RiskBadge tier={uc.risk_tier} />
            <span className={`font-mono text-sm font-semibold ${riskScoreColor(uc.risk_score)}`}>Score: {uc.risk_score.toFixed(3)}</span>
          </div>
        </div>
        <button onClick={rescore} disabled={rescoring} className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded px-3 py-1.5 hover:bg-slate-50">
          <RefreshCw size={14} className={rescoring ? 'animate-spin' : ''} /> Rescore
        </button>
      </div>

      <p className="text-sm text-slate-600">{uc.description}</p>

      <div className="grid grid-cols-2 gap-6">
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
              ['Approved By', uc.approved_by ?? '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-800 capitalize">{v}</dd>
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
