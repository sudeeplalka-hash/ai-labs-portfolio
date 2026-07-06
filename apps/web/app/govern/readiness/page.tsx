'use client';
import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

type Status = 'covered' | 'partial' | 'gap';
type Fw = 'all' | 'eu' | 'nist' | 'iso';

interface Area {
  area: string; status: Status; how: string;
  eu: string; nist: string; iso: string;
}
const AREAS: Area[] = [
  { area: 'Data governance & PII', status: 'covered', how: 'PII guardrail detects and redacts sensitive data pre-processing.', eu: 'Art. 10', nist: 'MEASURE 2.10', iso: 'A.7.2 / A.7.4' },
  { area: 'Human oversight', status: 'covered', how: 'Escalation routes high risk actions to a review queue with SLAs.', eu: 'Art. 14', nist: 'MANAGE 2.3', iso: 'A.9.2' },
  { area: 'Robustness & security', status: 'covered', how: 'Prompt-injection guardrail + tamper-evident audit chain.', eu: 'Art. 15', nist: 'MEASURE 2.7', iso: 'A.6.2.6' },
  { area: 'Bias & fairness', status: 'covered', how: 'Protected-class guardrail blocks discriminatory decisions.', eu: 'Annex III(4)', nist: 'MEASURE 2.11', iso: 'A.7.3' },
  { area: 'Record-keeping & logging', status: 'covered', how: 'SHA-256 hash-chained audit log, verifiable on demand.', eu: 'Art. 12 / 19', nist: 'MANAGE 4.3', iso: 'A.6.2.8' },
  { area: 'Risk management', status: 'covered', how: 'Use case risk scoring + tiering drives required controls.', eu: 'Art. 9', nist: 'MAP 1.1', iso: 'A.5.2' },
  { area: 'Transparency & disclosure', status: 'partial', how: 'Disclaimers + citation checks; end-user notices still manual.', eu: 'Art. 13', nist: 'MEASURE 2.9', iso: 'A.8.2' },
  { area: 'Post-market monitoring', status: 'partial', how: 'Eval Lab + runtime metrics; continuous drift monitoring is roadmap.', eu: 'Art. 72', nist: 'MANAGE 4.1', iso: 'A.6.2.8' },
];
const FRAMEWORKS: { id: Fw; label: string }[] = [
  { id: 'all', label: 'All frameworks' }, { id: 'eu', label: 'EU AI Act' }, { id: 'nist', label: 'NIST AI RMF' }, { id: 'iso', label: 'ISO 42001' },
];
const STATUS = {
  covered: { icon: CheckCircle2, label: 'Covered', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', bar: '#16a34a', w: 1 },
  partial: { icon: AlertTriangle, label: 'Partial', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', bar: '#d97706', w: 0.5 },
  gap: { icon: XCircle, label: 'Gap', cls: 'bg-red-50 text-red-700 ring-red-600/20', bar: '#dc2626', w: 0 },
};

export default function Readiness() {
  const [fw, setFw] = useState<Fw>('all');
  const cite = (a: Area) => fw === 'eu' ? a.eu : fw === 'nist' ? a.nist : fw === 'iso' ? a.iso : `${a.eu} · ${a.nist} · ${a.iso}`;
  const coverage = Math.round((AREAS.reduce((s, a) => s + STATUS[a.status].w, 0) / AREAS.length) * 100);

  return (
    <div className="p-8 space-y-6 max-w-[1050px]">
      <div>
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Regulatory readiness</p>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">Am I ready for the AI rulebook?</h1>
        <p className="text-sm text-slate-500 mt-1">How the control plane maps to the obligations that matter.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FRAMEWORKS.map((f) => (
          <button key={f.id} onClick={() => setFw(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${fw === f.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Coverage</span>
          <span className="text-lg font-semibold text-slate-900">{coverage}%</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-2 bg-emerald-500" style={{ width: `${coverage}%`, transition: 'width .4s' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AREAS.map((a) => {
          const st = STATUS[a.status];
          const Icon = st.icon;
          return (
            <div key={a.area} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{a.area}</p>
                <span className={`inline-flex items-center gap-1 text-xs rounded-md px-2 py-0.5 ring-1 ring-inset ${st.cls}`}>
                  <Icon size={12} /> {st.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.how}</p>
              <p className="text-[11px] font-mono text-slate-400 mt-2">{cite(a)}</p>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">Mapping is illustrative and scoped to this reference implementation, not a legal compliance determination.</p>
    </div>
  );
}
