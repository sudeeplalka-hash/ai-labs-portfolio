'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface Q { id: string; dim: string; q: string; options: string[]; }
const QUESTIONS: Q[] = [
  { id: 'intake', dim: 'Use case intake', q: 'How do new AI use cases get registered?', options: ['Ad hoc / not tracked', 'A spreadsheet somewhere', 'A central registry with owners', 'Registry + risk gating before build'] },
  { id: 'risk', dim: 'Risk tiering', q: 'How is AI risk classified?', options: ['It isn’t', 'Informal judgement', 'A documented rubric', 'Automated scoring tied to controls'] },
  { id: 'runtime', dim: 'Runtime controls', q: 'What stops a harmful AI response in production?', options: ['Nothing automated', 'Basic content filter', 'Several guardrails', 'Layered guardrails + decision engine'] },
  { id: 'oversight', dim: 'Human oversight', q: 'How are high risk AI actions reviewed?', options: ['They aren’t', 'Occasional spot checks', 'A review process exists', 'Routed escalation queue with SLAs'] },
  { id: 'evals', dim: 'Testing & evals', q: 'How do you know the controls actually work?', options: ['We assume they do', 'Manual testing', 'Periodic red-team tests', 'Automated eval suites in CI'] },
  { id: 'evidence', dim: 'Audit & evidence', q: 'Could you show a regulator your AI controls?', options: ['No', 'We’d scramble', 'We keep logs', 'One-click audit-ready evidence'] },
];
const STAGES = [
  { name: 'Crawl', blurb: 'AI is running ahead of governance. Start with a registry and risk tiering.', color: '#dc2626' },
  { name: 'Walk', blurb: 'Foundations exist. Add runtime guardrails and a review process.', color: '#d97706' },
  { name: 'Run', blurb: 'Controls operate. Prove them with evals and audit evidence.', color: '#1f6fc4' },
  { name: 'Fly', blurb: 'Governance is an operating system. Optimise and scale with confidence.', color: '#16a34a' },
];

export default function Maturity() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const hydrated = useRef(false);
  useEffect(() => {
    try { const d = JSON.parse(localStorage.getItem('gov.maturity') || 'null'); if (d) setAnswers(d); } catch { /* ignore */ }
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem('gov.maturity', JSON.stringify(answers)); } catch { /* ignore */ }
  }, [answers]);
  const answered = Object.keys(answers).length;
  const total = QUESTIONS.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
  const max = QUESTIONS.length * 3;
  const pct = answered ? Math.round((total / max) * 100) : 0;
  const stageIdx = answered < QUESTIONS.length ? -1 : pct >= 80 ? 3 : pct >= 55 ? 2 : pct >= 30 ? 1 : 0;
  const weakest = [...QUESTIONS].filter((q) => answers[q.id] !== undefined).sort((a, b) => (answers[a.id] ?? 0) - (answers[b.id] ?? 0)).slice(0, 3);

  return (
    <div className="p-8 space-y-6 max-w-[1000px]">
      <div>
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Maturity index</p>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">Where is your AI governance today?</h1>
        <p className="text-sm text-slate-500 mt-1">Six quick questions. No data leaves your browser.</p>
      </div>

      {/* Curve */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
        <div className="flex items-end justify-between gap-2 mb-2">
          {STAGES.map((st, i) => (
            <div key={st.name} className="flex-1 text-center">
              <div className="h-1.5 rounded-full mb-2" style={{ background: stageIdx === i ? st.color : '#e2e8f0' }} />
              <span className="text-xs font-medium" style={{ color: stageIdx === i ? st.color : '#94a3b8' }}>{st.name}</span>
            </div>
          ))}
        </div>
        {stageIdx >= 0 ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="text-3xl font-semibold" style={{ color: STAGES[stageIdx].color }}>{pct}%</div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{STAGES[stageIdx].name}</p>
              <p className="text-xs text-slate-500">{STAGES[stageIdx].blurb}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 mt-3">Answer all six to see your stage. {answered}/6 done.</p>
        )}
      </div>

      <div className="space-y-3">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{q.dim}</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5 mb-2">{q.q}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${answers[q.id] === i ? 'border-primary bg-blue-50 text-slate-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {stageIdx >= 0 && weakest.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <p className="text-sm font-semibold text-slate-700 mb-2">Your next three moves</p>
          <ul className="space-y-1.5">
            {weakest.map((q) => (
              <li key={q.id} className="flex items-start gap-2 text-sm text-slate-600">
                <ArrowRight size={15} className="text-primary mt-0.5 shrink-0" />
                Strengthen <span className="font-medium">{q.dim.toLowerCase()}</span>, it&apos;s your lowest-scoring dimension.
              </li>
            ))}
          </ul>
          <button onClick={() => setAnswers({})} className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
