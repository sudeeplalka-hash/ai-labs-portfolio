'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Policy } from '@/lib/types';
import { SeverityBadge } from '@/components/shared/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { ToggleLeft, ToggleRight } from 'lucide-react';

const DECISION_STYLES: Record<string, string> = {
  BLOCK: 'bg-red-100 text-red-800',
  ESCALATE: 'bg-orange-100 text-orange-800',
  REDACT: 'bg-purple-100 text-purple-800',
  ALLOW_WITH_DISCLAIMER: 'bg-sky-100 text-sky-800',
  REQUIRE_CONFIRMATION: 'bg-amber-100 text-amber-800',
  LOG_ONLY: 'bg-slate-100 text-slate-700',
};

export default function PolicyWorkbench() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.policies.list().then(d => {
      setPolicies(d);
      const slug = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('policy') : null;
      const focused = slug ? d.find(p => p.body_yaml?.includes(`id: ${slug}`) || p.name.toLowerCase().includes(slug.replace(/-/g, ' '))) : null;
      setSelected(focused || (d.length ? d[0] : null));
    }).finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    await api.policies.toggle(id);
    setPolicies(ps => ps.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    if (selected?.id === id) setSelected(s => s ? { ...s, enabled: !s.enabled } : s);
  };

  const filtered = policies.filter(p =>
    !filter || p.category === filter || p.severity === filter || p.action.includes(filter)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Governance</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Policy Workbench</h2>
        <p className="text-sm text-slate-500 mt-1">{policies.filter(p => p.enabled).length} of {policies.length} policies active</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'safety', 'privacy', 'compliance', 'operational'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1 text-xs rounded-full border transition-colors', filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400')}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map(p => (
              <button key={p.id} onClick={() => setSelected(p)} className={cn('w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors', selected?.id === p.id ? 'bg-blue-50 border-l-2 border-blue-500' : '')}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800 leading-tight">{p.name}</span>
                  <span className={cn('inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ml-2 shrink-0', DECISION_STYLES[p.action] || 'bg-slate-100 text-slate-700')}>{p.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={p.severity} />
                  <span className="text-xs text-slate-400 capitalize">{p.category}</span>
                  <span className={cn('text-xs ml-auto', p.enabled ? 'text-emerald-600' : 'text-slate-400')}>{p.enabled ? '● Active' : '○ Disabled'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{selected.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">v{selected.version} · {selected.match_count} matches</p>
                </div>
                <button onClick={() => toggle(selected.id)} className={cn('text-xs px-3 py-1.5 rounded border font-medium transition-colors', selected.enabled ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100')}>
                  {selected.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">{selected.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <SeverityBadge severity={selected.severity} />
                <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-semibold', DECISION_STYLES[selected.action] || 'bg-slate-100 text-slate-700')}>{selected.action}</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs capitalize">{selected.category}</span>
              </div>
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map(t => <span key={t} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{t}</span>)}
                </div>
              )}
            </div>

            {selected.frameworks && (selected.frameworks.nist_ai_rmf?.length || selected.frameworks.eu_ai_act?.length || selected.frameworks.iso_42001?.length) ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Regulatory &amp; Standards Mapping</h4>
                <div className="space-y-3">
                  <FrameworkRow label="NIST AI RMF 1.0" items={selected.frameworks.nist_ai_rmf} />
                  <FrameworkRow label="EU AI Act" items={selected.frameworks.eu_ai_act} />
                  <FrameworkRow label="ISO/IEC 42001:2023" items={selected.frameworks.iso_42001} />
                </div>
              </div>
            ) : null}

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Policy Definition (YAML)</h4>
              <pre className="bg-slate-900 text-emerald-400 rounded p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{selected.body_yaml}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FrameworkRow({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-700 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((i) => (
          <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">{i}</span>
        ))}
      </div>
    </div>
  );
}
