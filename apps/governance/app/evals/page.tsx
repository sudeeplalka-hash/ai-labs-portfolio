'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EvalSuite, EvalRun, EvalCompare } from '@/lib/types';
import { StatusBadge } from '@/components/shared/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Play, CheckCircle, XCircle, GitCompareArrows } from 'lucide-react';

export default function EvalLab() {
  const [suites, setSuites] = useState<EvalSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, EvalRun>>({});
  const [cmp, setCmp] = useState<Record<string, EvalCompare | { error: string }>>({});
  const [comparing, setComparing] = useState<Record<string, boolean>>({});

  const compareSuite = async (id: string) => {
    setComparing(c => ({ ...c, [id]: true }));
    try {
      const result = await api.evals.compare(id);
      setCmp(c => ({ ...c, [id]: result }));
    } catch {
      setCmp(c => ({ ...c, [id]: { error: 'Run the suite at least twice to compare versions.' } }));
    } finally {
      setComparing(c => ({ ...c, [id]: false }));
    }
  };

  const [focusCat, setFocusCat] = useState<string | null>(null);
  useEffect(() => {
    api.evals.suites().then(setSuites).finally(() => setLoading(false));
    if (typeof window !== 'undefined') {
      const c = new URLSearchParams(window.location.search).get('suite');
      if (c) { setFocusCat(c); setTimeout(() => document.getElementById(`suite-${c}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }
    }
  }, []);

  const runSuite = async (id: string) => {
    setRunning(r => ({ ...r, [id]: true }));
    try {
      const run = await api.evals.runSuite(id);
      setResults(r => ({ ...r, [id]: run }));
      setSuites(s => s.map(suite => suite.id === id ? { ...suite, last_run_pass_rate: run.pass_rate, last_run_at: run.started_at } : suite));
    } finally {
      setRunning(r => ({ ...r, [id]: false }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Red Team</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Evaluation & Red Team Lab</h2>
        <p className="text-sm text-slate-500 mt-1">Run adversarial eval suites against the governance pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {suites.map(suite => {
          const run = results[suite.id];
          const isRunning = running[suite.id];
          const passRate = run ? run.pass_rate : suite.last_run_pass_rate;
          return (
            <div key={suite.id} id={`suite-${suite.category}`} className={cn('bg-white border rounded-xl p-5 space-y-3 transition-shadow', focusCat === suite.category ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200')}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{suite.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{suite.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button onClick={() => compareSuite(suite.id)} disabled={comparing[suite.id]} className="flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded hover:bg-slate-50 disabled:opacity-50" title="Compare the two most recent runs">
                    <GitCompareArrows size={12} /> {comparing[suite.id] ? '…' : 'Compare'}
                  </button>
                  <button onClick={() => runSuite(suite.id)} disabled={isRunning} className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                    <Play size={12} /> {isRunning ? 'Running…' : 'Run'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{suite.case_count} test cases</span>
                {suite.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>)}
              </div>

              {passRate != null && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Pass Rate</span>
                    <span className={cn('font-semibold', passRate >= 80 ? 'text-emerald-600' : passRate >= 60 ? 'text-amber-600' : 'text-red-600')}>{passRate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${passRate}%`, backgroundColor: passRate >= 80 ? '#10b981' : passRate >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              )}

              {run && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Passed', val: run.passed, color: 'text-emerald-600' },
                    { label: 'Failed', val: run.failed, color: 'text-red-600' },
                    { label: 'FP', val: run.false_positives, color: 'text-amber-600' },
                    { label: 'FN', val: run.false_negatives, color: 'text-orange-600' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="text-center">
                      <p className={cn('text-lg font-bold', color)}>{val}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {run?.results && run.results.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-1 max-h-32 overflow-y-auto">
                  {run.results.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      {r.status === 'pass' ? <CheckCircle size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-red-500" />}
                      <span className="text-slate-600 truncate flex-1">{r.details?.prompt_excerpt as string || 'Test case'}</span>
                      <span className="text-slate-400 shrink-0">{r.actual_decision}</span>
                    </div>
                  ))}
                </div>
              )}

              {cmp[suite.id] && (
                'error' in cmp[suite.id] ? (
                  <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">{(cmp[suite.id] as { error: string }).error}</p>
                ) : (
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <GitCompareArrows size={12} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Version comparison (last two runs)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {(() => { const v = cmp[suite.id] as EvalCompare; return [
                        { label: 'Δ Pass Rate', val: `${v.pass_rate_delta > 0 ? '+' : ''}${v.pass_rate_delta}%`, color: v.pass_rate_delta < 0 ? 'text-red-600' : 'text-emerald-600' },
                        { label: 'Changed', val: v.changed, color: 'text-slate-700' },
                        { label: 'Regressed', val: v.regressed, color: v.regressed > 0 ? 'text-red-600' : 'text-slate-700' },
                        { label: 'Improved', val: v.improved, color: 'text-emerald-600' },
                      ]; })().map(({ label, val, color }) => (
                        <div key={label}><p className={cn('text-base font-bold', color)}>{val}</p><p className="text-[10px] text-slate-400">{label}</p></div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
