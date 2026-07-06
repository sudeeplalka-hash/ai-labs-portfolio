'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PromptEvent, AuditVerify } from '@/lib/types';
import { DecisionBadge, SeverityBadge } from '@/components/shared/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';
import { Filter, ShieldCheck, ShieldAlert } from 'lucide-react';

const DECISIONS = ['', 'ALLOW', 'REDACT', 'ESCALATE', 'BLOCK', 'REQUIRE_CONFIRMATION', 'ALLOW_WITH_DISCLAIMER'];

export default function AuditLogs() {
  const [events, setEvents] = useState<PromptEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [selected, setSelected] = useState<PromptEvent | null>(null);
  const [chain, setChain] = useState<AuditVerify | null>(null);
  const [verifying, setVerifying] = useState(false);

  const verify = () => { setVerifying(true); api.audit.verify().then(setChain).finally(() => setVerifying(false)); };
  useEffect(() => { verify(); }, []);

  useEffect(() => {
    setLoading(true);
    api.audit.promptEvents({ decision: decision || undefined, limit: 100 }).then(setEvents).finally(() => setLoading(false));
  }, [decision]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Compliance</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Audit Log Explorer</h2>
        <p className="text-sm text-slate-500 mt-1">Full audit trail of all AI interactions and governance decisions</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${chain && !chain.valid ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {chain && !chain.valid ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            Audit-Chain Integrity {chain ? (chain.valid ? '· Verified' : '· TAMPER DETECTED') : ''}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {chain
              ? <>SHA-256 hash chain over {chain.total_events} events{chain.valid && chain.tip_hash ? <> · tip <span className="font-mono">{chain.tip_hash.slice(0, 16)}…</span></> : chain.broken_at ? <> · broken at {chain.broken_at.slice(0, 8)}…</> : ''}</>
              : 'Tamper-evident log mapped to EU AI Act Art. 12 / NIST MANAGE-4.3.'}
          </p>
        </div>
        <button onClick={verify} disabled={verifying} className="shrink-0 text-xs border border-slate-200 text-slate-600 rounded px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">
          {verifying ? 'Verifying…' : 'Re-verify chain'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-slate-400" />
        <div className="flex gap-2 flex-wrap">
          {DECISIONS.map(d => (
            <button key={d} onClick={() => setDecision(d)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${decision === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              {d || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
              {events.map(ev => (
                <button key={ev.id} onClick={() => setSelected(ev)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === ev.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 font-mono">{ev.id.slice(0, 8)}…</span>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={ev.severity} />
                      <DecisionBadge decision={ev.decision} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 truncate">{ev.prompt}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ev.created_at ? formatDateTime(ev.created_at) : 'N/A'} · Risk: {ev.risk_score.toFixed(2)}</p>
                </button>
              ))}
              {events.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No events found.</p>}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Event Detail</h3>
                <div className="space-y-2 text-sm">
                  {[
                    ['Event ID', selected.id.slice(0, 16) + '…'],
                    ['Decision', selected.decision],
                    ['Severity', selected.severity],
                    ['Risk Score', selected.risk_score.toFixed(3)],
                    ['Risk Level', selected.risk_level],
                    ['Confidence', `${(selected.confidence * 100).toFixed(0)}%`],
                    ['Latency', `${selected.latency_ms.toFixed(0)}ms`],
                    ['Audit Status', selected.audit_status],
                    ['Review Status', selected.review_status],
                    ['Timestamp', selected.created_at ? formatDateTime(selected.created_at) : 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-medium text-slate-800 text-right">{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Prompt</p>
                  <p className="text-xs text-slate-600 bg-slate-50 rounded p-3 whitespace-pre-wrap">{selected.prompt}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-400 text-sm">Select an event to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
