'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ReviewItem } from '@/lib/types';
import { SeverityBadge, StatusBadge, DecisionBadge } from '@/components/shared/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';
import { Clock, Lock } from 'lucide-react';
import { useRole, can, roleLabel } from '@/lib/rbac';

const ACTIONS = [
  { key: 'approve', label: 'Approve', style: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  { key: 'reject', label: 'Reject', style: 'bg-red-600 text-white hover:bg-red-700' },
  { key: 'false_positive', label: 'False Positive', style: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
  { key: 'request_context', label: 'Request Context', style: 'border border-slate-200 text-slate-600 hover:bg-slate-50' },
  { key: 'escalate_compliance', label: 'Escalate to Compliance', style: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
];

export default function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actioning, setActioning] = useState(false);
  const [notes, setNotes] = useState('');
  const role = useRole();
  const mayAct = can(role, 'review:act');

  const load = () => {
    setLoading(true);
    api.reviewQueue.list({ status: statusFilter || undefined }).then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const take = async (action: string) => {
    if (!selected) return;
    setActioning(true);
    try {
      const updated = await api.reviewQueue.action(selected.id, { action, reviewer: 'reviewer@corp.example.com', notes });
      setSelected(updated);
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } finally { setActioning(false); }
  };

  const isOverdue = (item: ReviewItem) => item.sla_deadline && new Date(item.sla_deadline) < new Date() && item.status === 'pending';

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Governance</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Human Review Queue</h2>
        <p className="text-sm text-slate-500 mt-1">{items.filter(i => i.status === 'pending').length} items pending review</p>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'in_review', 'approved', 'rejected', 'false_positive'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-[680px] overflow-y-auto divide-y divide-slate-100">
              {items.map(item => (
                <button key={item.id} onClick={() => { setSelected(item); setNotes(''); }} className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${selected?.id === item.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''} ${isOverdue(item) ? 'border-l-2 border-red-400' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={item.status} />
                    <div className="flex items-center gap-1.5">
                      {isOverdue(item) && <Clock size={12} className="text-red-500" />}
                      <SeverityBadge severity={item.severity} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 truncate mt-1">{item.original_prompt}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.created_at ? formatDateTime(item.created_at) : 'N/A'}</p>
                </button>
              ))}
              {items.length === 0 && <p className="text-slate-400 text-sm py-10 text-center">No items in queue.</p>}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={selected.status} />
                  <SeverityBadge severity={selected.severity} />
                  <DecisionBadge decision={selected.original_decision} />
                  <span className="text-xs text-slate-400 ml-auto">SLA: {selected.sla_hours}h</span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Original Prompt</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded p-3">{selected.original_prompt}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Escalation Reason</p>
                  <p className="text-sm text-slate-700">{selected.escalation_reason}</p>
                </div>

                {selected.triggered_guardrails.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Triggered Guardrails</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.triggered_guardrails.map(g => <span key={g} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded">{g}</span>)}
                    </div>
                  </div>
                )}

                {selected.reviewer_notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reviewer Notes</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{selected.reviewer_notes}</p>
                  </div>
                )}

                {selected.status === 'pending' || selected.status === 'in_review' ? (
                  mayAct ? (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <textarea className="w-full border border-slate-200 rounded px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add reviewer notes…" value={notes} onChange={e => setNotes(e.target.value)} />
                    <div className="flex flex-wrap gap-2">
                      {ACTIONS.map(a => (
                        <button key={a.key} onClick={() => take(a.key)} disabled={actioning} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${a.style}`}>
                          {actioning ? '…' : a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  ) : (
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <Lock size={14} /> Separation of duties: the <strong>{roleLabel(role)}</strong> role cannot action review items. Switch to <strong>Governance Reviewer</strong> in the sidebar.
                  </div>
                  )
                ) : (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">Reviewed by <strong>{selected.reviewed_by}</strong> · {selected.reviewed_at ? formatDateTime(selected.reviewed_at) : 'N/A'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <p className="text-slate-400 text-sm">Select an item to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
