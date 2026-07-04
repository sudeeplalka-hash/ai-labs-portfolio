'use client';
import { useEffect, useState } from 'react';
import { DecisionBadge } from '@gov/components/shared/Badge';

const POOL = [
  { uc: 'Finance Portfolio Assistant', decision: 'ALLOW', text: 'Variance summary requested' },
  { uc: 'Customer Dispute Assistant', decision: 'REDACT', text: 'PII detected in a dispute note' },
  { uc: 'Finance Portfolio Assistant', decision: 'ESCALATE', text: 'Credit-line recommendation requested' },
  { uc: 'Agentic Workflow Assistant', decision: 'REQUIRE_CONFIRMATION', text: 'External email drafted' },
  { uc: 'HR Policy Assistant', decision: 'BLOCK', text: 'Protected-class ranking blocked' },
  { uc: 'RAG Knowledge Assistant', decision: 'ALLOW_WITH_DISCLAIMER', text: 'Unsourced claim disclaimed' },
  { uc: 'Agentic Workflow Assistant', decision: 'ESCALATE', text: 'Bulk data export held for review' },
  { uc: 'Finance Portfolio Assistant', decision: 'BLOCK', text: 'Prompt-injection attempt blocked' },
];
interface Ev { id: number; uc: string; decision: string; text: string; t: string }

export function ActivityTicker() {
  const [events, setEvents] = useState<Ev[]>(() => POOL.slice(0, 5).map((e, i) => ({ ...e, id: i, t: `${(i + 1) * 7}s ago` })));
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let n = 1000;
    const id = setInterval(() => {
      const e = POOL[Math.floor(Math.random() * POOL.length)];
      setEvents((prev) => [{ ...e, id: n++, t: 'just now' }, ...prev.slice(0, 4)]);
    }, 3500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <p className="text-sm font-semibold text-slate-700">Live governance activity</p>
      </div>
      <div className="space-y-1.5" aria-live="polite" aria-label="Recent governance decisions">
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 text-sm">
            <DecisionBadge decision={e.decision} />
            <span className="text-slate-700 flex-1 truncate">{e.text}</span>
            <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[180px]">{e.uc}</span>
            <span className="text-xs text-slate-400 w-16 text-right shrink-0">{e.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
