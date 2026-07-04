'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { ExecutiveMetrics } from '@/lib/types';
import { FileText, Printer, ShieldCheck } from 'lucide-react';

const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function Brief() {
  const [m, setM] = useState<ExecutiveMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);
    api.metrics.executive().then(setM).finally(() => setLoading(false));
  };

  return (
    <div className="p-8 max-w-[860px] mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Board brief</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">One page for the board</h1>
          <p className="text-sm text-slate-500 mt-1">Turn the live posture into a screenshot-ready executive summary.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generate} className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            <FileText size={15} /> {m ? 'Regenerate' : loading ? 'Generating…' : 'Generate brief'}
          </button>
          {m && (
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-lg hover:bg-slate-50">
              <Printer size={15} /> Print
            </button>
          )}
        </div>
      </div>

      {!m ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-card">
          <FileText size={28} className="text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400 mt-2">Generate the brief to see the board-ready one-pager.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-card space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Enterprise AI Governance — Board Brief</h2>
              <p className="text-xs text-slate-500 mt-0.5">{today} · Financial Services AI Portfolio · Confidential</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand to-sky-400 text-white shrink-0">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Portfolio posture</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Active AI use cases', v: m.active_use_cases },
                { l: 'High-risk systems', v: m.high_risk_use_cases },
                { l: 'Launch readiness', v: `${m.value_metrics.launch_readiness_pct}%` },
                { l: 'Active policies', v: m.active_policies },
              ].map((x) => (
                <div key={x.l} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-semibold text-slate-900">{x.v}</p>
                  <p className="text-[11px] text-slate-500">{x.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Value &amp; containment</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Risky interactions auto-contained', v: `${m.value_metrics.auto_contained_rate}%` },
                { l: 'Automated control actions', v: m.value_metrics.automated_actions },
                { l: 'Routed to human review', v: m.value_metrics.human_escalations },
                { l: 'Review hours saved / period', v: `~${m.value_metrics.review_hours_saved}h` },
              ].map((x) => (
                <div key={x.l} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-2xl font-semibold text-emerald-600">{x.v}</p>
                  <p className="text-[11px] text-slate-500">{x.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Where risk concentrates</p>
              <ul className="space-y-1.5">
                {[...m.business_function_risk].sort((a, b) => b.avg_risk_score - a.avg_risk_score).slice(0, 3).map((f) => (
                  <li key={f.function} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{f.function}</span>
                    <span className="text-xs font-medium text-slate-500">{f.risk_tier} · {f.use_case_count} system{f.use_case_count === 1 ? '' : 's'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Mapped to</p>
              <div className="flex flex-wrap gap-1.5">
                {m.value_metrics.frameworks_covered.map((f) => (
                  <span key={f} className="text-xs bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 rounded-md px-2 py-0.5">{f}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Recommendation</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              The AI portfolio is operating inside risk tolerance: {m.value_metrics.auto_contained_rate}% of risky interactions are
              contained automatically and the remainder routed to human review, with a tamper-evident audit trail mapped to
              three governance frameworks. Recommend proceeding to scale, with continued red-team evals and a quarterly board review.
            </p>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Generated by the Enterprise AI Governance Control Plane · figures reflect the current demonstration dataset.
          </p>
        </div>
      )}
    </div>
  );
}
