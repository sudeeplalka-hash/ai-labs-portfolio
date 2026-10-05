'use client';
import { useRef } from 'react';
import { PlaybackControls, useInViewport, usePlayback } from '@labs/design-system';
import { DecisionBadge } from '@gov/components/shared/Badge';

const EXAMPLES = [
  { uc: 'Finance Portfolio Assistant', decision: 'ALLOW', text: 'Variance summary requested' },
  { uc: 'Customer Dispute Assistant', decision: 'REDACT', text: 'PII detected in a dispute note' },
  { uc: 'Finance Portfolio Assistant', decision: 'ESCALATE', text: 'Credit line recommendation requested' },
  { uc: 'Agentic Workflow Assistant', decision: 'REQUIRE_CONFIRMATION', text: 'External email drafted' },
  { uc: 'HR Policy Assistant', decision: 'BLOCK', text: 'Protected class ranking blocked' },
  { uc: 'RAG Knowledge Assistant', decision: 'ALLOW_WITH_DISCLAIMER', text: 'Unsourced claim disclaimed' },
  { uc: 'Agentic Workflow Assistant', decision: 'ESCALATE', text: 'Bulk data export held for review' },
  { uc: 'Finance Portfolio Assistant', decision: 'BLOCK', text: 'Prompt injection attempt blocked' },
];

export function ActivityTicker() {
  const ref = useRef<HTMLElement>(null);
  const visible = useInViewport(ref);
  const playback = usePlayback({ steps: EXAMPLES.length, intervalMs: 1100, visible });
  return <section ref={ref} aria-label="Illustrative governance decisions" className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
    <h3 className="font-semibold text-slate-900">Decision examples</h3>
    <p className="mt-1 text-sm text-slate-500">Illustrative records show how each control responds. These are fixed examples, not a live activity feed.</p>
    <div className="my-4"><PlaybackControls playback={playback} steps={EXAMPLES.length} label="Explore decision examples" /></div>
    <ol className="divide-y divide-slate-100">
      {EXAMPLES.slice(0, playback.index).map((event, index) => <li key={`${event.uc}-${event.decision}`} className="grid gap-1 py-3 sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <div className="flex items-center gap-2"><span className="text-xs tabular-nums text-slate-500">{index + 1}.</span><DecisionBadge decision={event.decision} /></div>
        <div><p className="text-sm text-slate-700">{event.text}</p><p className="mt-1 text-xs text-slate-500">{event.uc}</p></div>
      </li>)}
    </ol>
    {playback.index === 0 && <p className="text-sm text-slate-500">Choose Step, Play or Show outcome to explore the recorded examples.</p>}
  </section>;
}
