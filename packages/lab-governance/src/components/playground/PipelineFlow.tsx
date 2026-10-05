'use client';
import { useEffect, useRef } from 'react';
import { PlaybackControls, useInViewport, usePlayback } from '@labs/design-system';
import type { PlaygroundResponse } from '@gov/lib/types';
import { Inbox, ShieldHalf, Cpu, ScanLine, Gavel, FileLock2 } from 'lucide-react';

const INPUT_TYPES = ['prompt_injection', 'pii', 'toxicity', 'bias', 'financial', 'tool_risk'];
const OUTPUT_TYPES = ['unsupported_claims', 'citation'];

export function PipelineFlow({ result }: { result: PlaygroundResponse }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInViewport(ref);
  const playback = usePlayback({ steps: 6, intervalMs: 700, visible });
  const { complete } = playback;
  useEffect(() => complete(), [result.prompt_event_id, complete]);
  const triggered = result.guardrail_results.filter((guardrail) => guardrail.triggered);
  const inputHit = triggered.some((guardrail) => INPUT_TYPES.includes(guardrail.guardrail_type));
  const outputHit = triggered.some((guardrail) => OUTPUT_TYPES.includes(guardrail.guardrail_type));
  const stages = [
    { icon: Inbox, label: 'Prompt', detail: 'Input recorded' },
    { icon: ShieldHalf, label: 'Input guardrails', detail: inputHit ? 'Control triggered' : 'No input control triggered' },
    { icon: Cpu, label: 'Model response', detail: result.decision === 'BLOCK' ? 'Response withheld' : 'Response available' },
    { icon: ScanLine, label: 'Output guardrails', detail: outputHit ? 'Control triggered' : 'No output control triggered' },
    { icon: Gavel, label: 'Decision', detail: result.decision.replaceAll('_', ' ') },
    { icon: FileLock2, label: 'Audit', detail: 'Result recorded for this run' },
  ];
  return <section ref={ref} aria-label="Governance decision explanation" className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
    <h3 className="font-semibold text-slate-900">Decision: {result.decision.replaceAll('_', ' ')}</h3>
    <p className="mt-1 text-sm text-slate-500">Follow the recorded checks behind this result. Optional playback changes the explanation pace, not the decision or recorded timing fields.</p>
    <div className="my-4"><PlaybackControls playback={playback} steps={stages.length} label="Explain governance result" /></div>
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const active = index < playback.index;
        return <li key={stage.label}><button onClick={() => playback.setIndex(index + 1)} aria-current={playback.index === index + 1 ? 'step' : undefined} className={`h-full w-full rounded-lg border p-3 text-left transition-colors motion-reduce:transition-none ${active ? 'border-primary/30 bg-primary-soft' : 'border-slate-200 bg-white'}`}>
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icon aria-hidden size={18} />{index + 1}. {stage.label}</span>
          <span className="mt-2 block text-xs leading-relaxed text-slate-600">{stage.detail}</span>
        </button></li>;
      })}
    </ol>
  </section>;
}
