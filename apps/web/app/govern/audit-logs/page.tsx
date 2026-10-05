'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { caseHref, caseContextHref } from '@gov/lib/navigation';
import { useRole, can, roleLabel } from '@gov/lib/rbac';
import { api } from '@gov/lib/api';
import type { PromptEvent, AuditVerify } from '@gov/lib/types';
import { DecisionBadge, SeverityBadge } from '@gov/components/shared/Badge';
import { LoadingSpinner } from '@gov/components/shared/LoadingSpinner';
import { formatDateTime, confidencePercent } from '@gov/lib/utils';
import { Filter, ShieldCheck, ShieldAlert } from 'lucide-react';

const DECISIONS = ['', 'ALLOW', 'REDACT', 'ESCALATE', 'BLOCK', 'REQUIRE_CONFIRMATION', 'ALLOW_WITH_DISCLAIMER'];

export default function AuditLogs() {
  const [events, setEvents] = useState<PromptEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [selected, setSelected] = useState<PromptEvent | null>(null);
  const [chain, setChain] = useState<AuditVerify | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [caseId, setCaseId] = useState('');
  const role = useRole();
  const mayVerify = can(role, 'audit:verify');
  const staticMode = process.env.NEXT_PUBLIC_STATIC_DEMO === '1';

  const verify = async () => {
    if (!mayVerify || verifying) return;
    setVerifying(true); setVerifyError('');
    try { setChain(await api.audit.verify()); }
    catch { setVerifyError('The integrity check did not complete. No new verification is claimed.'); }
    finally { setVerifying(false); }
  };

  useEffect(() => {
    let current = true;
    const context = new URLSearchParams(window.location.search);
    const filterCase = context.get('case') || '';
    const filterEvent = context.get('event');
    setCaseId(filterCase);
    setLoading(true);
    setError('');
    api.audit.promptEvents({ decision: decision || undefined, use_case_id: filterCase || undefined, limit: 100 }).then((records) => {
      if (!current) return;
      setEvents(records);
      setSelected((prior) => records.find((record) => record.id === filterEvent || record.id === prior?.id) ?? null);
    }).catch(() => { if (current) setError('Audit events could not load.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [decision, attempt]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Compliance</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Audit Log Explorer</h2>
        <p className="text-sm text-slate-500 mt-1">Inspect recorded AI interactions and governance decisions, up to 100 events per request.</p>
      </div>

      {caseId && <p className="text-sm text-slate-600">Events for <Link href={caseHref(caseId)} className="text-primary underline">case {caseId}</Link>.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error} <button onClick={() => setAttempt((value) => value + 1)} className="underline">Retry</button></p>}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${!chain ? 'bg-slate-100 text-slate-500' : !chain.valid ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {chain?.valid ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            Audit-chain integrity {chain ? (chain.valid ? staticMode ? '· Sample snapshot reports intact' : '· API reports verified' : '· Integrity check failed') : '· Not checked'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {chain
              ? <>SHA-256 hash chain over {chain.total_events} events{chain.valid && chain.tip_hash ? <> · tip <span className="font-mono">{chain.tip_hash.slice(0, 16)}…</span></> : chain.broken_at ? <> · broken at {chain.broken_at.slice(0, 8)}…</> : ''}</>
              : 'Request the available integrity record before drawing a conclusion.'}
          </p>
        </div>
        <button onClick={verify} disabled={verifying || !mayVerify} aria-describedby={!mayVerify ? 'audit-role-note' : undefined} className="shrink-0 text-xs border border-slate-200 text-slate-600 rounded px-3 py-2 hover:bg-slate-50 disabled:opacity-50">
          {verifying ? 'Checking…' : staticMode ? 'Inspect snapshot integrity' : 'Verify chain'}
        </button>
      </div>
      {staticMode && <p className="text-xs text-slate-500">The static deployment returns an embedded verification record. This action does not recompute hashes for new browser-session activity.</p>}
      {!mayVerify && <p id="audit-role-note" className="text-sm text-slate-500">{roleLabel(role)} can read events. Integrity verification requires Risk &amp; Audit or Administrator.</p>}
      {verifyError && <p role="alert" className="text-sm text-red-700">{verifyError}</p>}

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
                <nav aria-label="Audit source records" className="flex flex-wrap gap-3 text-sm"><Link href={caseHref(selected.use_case_id)} className="text-primary underline">Originating case</Link><Link href={caseContextHref('/govern/review-queue', selected.use_case_id, selected.id)} className="text-primary underline">Related human review</Link></nav>
                <div className="space-y-2 text-sm">
                  {[
                    ['Event ID', selected.id.slice(0, 16) + '…'],
                    ['Decision', selected.decision],
                    ['Severity', selected.severity],
                    ['Risk Score', selected.risk_score.toFixed(3)],
                    ['Risk Level', selected.risk_level],
                    ['Confidence', confidencePercent(selected.confidence)],
                    [staticMode ? 'Modeled latency' : 'Recorded latency', `${selected.latency_ms.toFixed(0)}ms`],
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
