'use client';
import { useEffect, useState } from 'react';
import type { PlaygroundResponse } from '@gov/lib/types';
import { Inbox, ShieldHalf, Cpu, ScanLine, Gavel, FileLock2 } from 'lucide-react';

const INPUT_TYPES = ['prompt_injection', 'pii', 'toxicity', 'bias', 'financial', 'tool_risk'];
const OUTPUT_TYPES = ['unsupported_claims', 'citation'];

const DECISION_HEX: Record<string, string> = {
  ALLOW: '#16a34a', ALLOW_WITH_DISCLAIMER: '#0891b2', REDACT: '#7c3aed',
  REWRITE: '#1f6fc4', REQUIRE_CONFIRMATION: '#d97706', ESCALATE: '#ea580c', BLOCK: '#dc2626', LOG_ONLY: '#64748b',
};

export function PipelineFlow({ result }: { result: PlaygroundResponse }) {
  const [step, setStep] = useState(-1);

  const triggered = result.guardrail_results.filter((g) => g.triggered);
  const inputHit = triggered.some((g) => INPUT_TYPES.includes(g.guardrail_type));
  const outputHit = triggered.some((g) => OUTPUT_TYPES.includes(g.guardrail_type));
  const blockedEarly = result.decision === 'BLOCK';

  const stages = [
    { icon: Inbox, label: 'Prompt', state: 'ok' as const },
    { icon: ShieldHalf, label: 'Input guardrails', state: inputHit ? 'hit' as const : 'ok' as const },
    { icon: Cpu, label: 'Model', state: blockedEarly ? 'skip' as const : 'ok' as const },
    { icon: ScanLine, label: 'Output guardrails', state: outputHit ? 'hit' as const : 'ok' as const },
    { icon: Gavel, label: 'Decision', state: 'decision' as const },
    { icon: FileLock2, label: 'Audit', state: 'audit' as const },
  ];

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setStep(stages.length - 1); return; }
    setStep(-1);
    let i = -1;
    const id = setInterval(() => { i += 1; setStep(i); if (i >= stages.length - 1) clearInterval(id); }, 220);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.prompt_event_id]);

  const colorFor = (state: string, lit: boolean) => {
    if (!lit) return { bg: 'var(--color, #f1f5f9)', fg: '#94a3b8', border: '#e2e8f0' };
    if (state === 'hit') return { bg: '#fef2f2', fg: '#dc2626', border: '#fecaca' };
    if (state === 'skip') return { bg: '#f1f5f9', fg: '#94a3b8', border: '#e2e8f0' };
    if (state === 'decision') { const c = DECISION_HEX[result.decision] || '#1f6fc4'; return { bg: c + '14', fg: c, border: c + '55' }; }
    if (state === 'audit') return { bg: '#ecfdf5', fg: '#16a34a', border: '#bbf7d0' };
    return { bg: '#eff6ff', fg: '#1f6fc4', border: '#bfdbfe' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card" role="img" aria-label="Governance pipeline: prompt, input guardrails, model, output guardrails, decision, audit">
      <p className="text-xs font-semibold text-slate-500 uppercase mb-4">Governance pipeline</p>
      <div className="flex items-center">
        {stages.map((s, i) => {
          const lit = step >= i;
          const Icon = s.icon;
          const c = colorFor(s.state, lit);
          return (
            <div key={s.label} className="flex items-center" style={{ flex: i < stages.length - 1 ? '1 1 0' : '0 0 auto' }}>
              <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 84 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                  style={{ background: c.bg, color: c.fg, borderColor: c.border, transition: 'all .25s ease', transform: lit ? 'scale(1)' : 'scale(0.92)' }}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] text-center leading-tight" style={{ color: lit ? '#475569' : '#94a3b8' }}>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="h-0.5 flex-1 mx-1 rounded-full" style={{ background: step > i ? '#cbd5e1' : '#eef2f6', transition: 'background .25s' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
