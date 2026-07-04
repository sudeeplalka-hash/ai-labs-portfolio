'use client';
import { useEffect, useState } from 'react';
import { api } from '@gov/lib/api';
import type { UseCase } from '@gov/lib/types';
import { RiskBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { riskScoreColor } from '@gov/lib/utils';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const TIER_COLORS: Record<string, string> = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };

export default function RiskStudio() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [selected, setSelected] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.useCases.list().then(d => { setUseCases(d); if (d.length) setSelected(d[0]); }).finally(() => setLoading(false));
  }, []);

  const radarData = selected ? [
    { factor: 'Deployment', value: selected.deployment_context === 'agentic' ? 100 : selected.deployment_context === 'customer-facing' ? 60 : 20 },
    { factor: 'Data Sensitivity', value: selected.data_sensitivity === 'regulated' ? 100 : selected.data_sensitivity === 'confidential' ? 60 : selected.data_sensitivity === 'internal' ? 20 : 0 },
    { factor: 'Oversight', value: selected.human_oversight === 'none' ? 100 : selected.human_oversight === 'optional' ? 50 : selected.human_oversight === 'required' ? 10 : 0 },
    { factor: 'Use Case Type', value: selected.use_case_type === 'agentic' ? 100 : selected.use_case_type === 'rag' ? 50 : 20 },
    { factor: 'Business Function', value: ['Finance', 'Legal'].includes(selected.business_function) ? 80 : ['Customer'].includes(selected.business_function) ? 50 : 30 },
  ] : [];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Risk Classification Studio</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Risk Scoring Studio</h2>
        <p className="text-sm text-slate-500 mt-1">Understand how each use case is scored across the five risk dimensions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Use case list */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Use Cases</p>
          </div>
          <div className="divide-y divide-slate-100">
            {useCases.map(uc => (
              <button key={uc.id} onClick={() => setSelected(uc)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === uc.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{uc.name}</span>
                  <RiskBadge tier={uc.risk_tier} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{uc.business_function} · {uc.use_case_type}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Risk detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{selected.name}</h3>
                <RiskBadge tier={selected.risk_tier} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-slate-100 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{ width: `${selected.risk_score * 100}%`, backgroundColor: TIER_COLORS[selected.risk_tier] }} />
                </div>
                <span className={`font-mono font-bold text-lg ${riskScoreColor(selected.risk_score)}`}>{selected.risk_score.toFixed(3)}</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
                  <Radar name="Risk" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Risk Drivers</h4>
                {selected.risk_drivers.length === 0
                  ? <p className="text-sm text-slate-400">No significant risk drivers.</p>
                  : <ul className="space-y-1">{selected.risk_drivers.map(d => <li key={d} className="text-xs text-slate-700">• {d}</li>)}</ul>
                }
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Required Controls</h4>
                <ul className="space-y-1">{selected.required_controls.map(c => <li key={c} className="text-xs text-slate-700">✓ {c}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio bar chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Portfolio Risk Scores</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={useCases.map(u => ({ name: u.name.split(' ')[0], score: u.risk_score, tier: u.risk_tier }))}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [v.toFixed(3), 'Risk Score']} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {useCases.map((u) => <Cell key={u.id} fill={TIER_COLORS[u.risk_tier] || '#94a3b8'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
