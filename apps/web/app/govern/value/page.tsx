'use client';
import { useState } from 'react';
import { useLens, setLens } from '@gov/lib/lens';
import { TrendingUp, Clock, ShieldCheck, Rocket } from 'lucide-react';

const WORKDAYS = 22;

function Slider({ label, value, set, min, max, step, fmt }: {
  label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-slate-600">{label}</label>
        <span className="text-sm font-semibold text-slate-900 tabular-nums">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))} className="w-full accent-[#1f6fc4]" />
    </div>
  );
}

const usd = (n: number) => '$' + Math.round(n).toLocaleString();
const compact = (n: number) => Math.round(n).toLocaleString();

export default function BusinessCase() {
  const lens = useLens();
  const [useCases, setUseCases] = useState(5);
  const [promptsPerDay, setPromptsPerDay] = useState(500);
  const [riskyPct, setRiskyPct] = useState(12);
  const [containment, setContainment] = useState(67);
  const [analystCost, setAnalystCost] = useState(75);
  const [minutesPerReview, setMinutesPerReview] = useState(15);
  const [weeksSaved, setWeeksSaved] = useState(8);

  const monthlyPrompts = useCases * promptsPerDay * WORKDAYS;
  const riskyMonthly = monthlyPrompts * (riskyPct / 100);
  const containedMonthly = riskyMonthly * (containment / 100);
  const escalatedMonthly = riskyMonthly - containedMonthly;
  const hoursSavedYr = (containedMonthly * (minutesPerReview / 60)) * 12;
  const dollarsSavedYr = hoursSavedYr * analystCost;
  const containedYr = containedMonthly * 12;
  const containPct = riskyMonthly > 0 ? Math.round((containedMonthly / riskyMonthly) * 100) : 0;

  const cards = [
    { icon: TrendingUp, label: 'Annual review cost avoided', value: usd(dollarsSavedYr), tone: 'text-emerald-600' },
    { icon: Clock, label: 'Analyst hours saved / year', value: compact(hoursSavedYr), tone: 'text-slate-900' },
    { icon: ShieldCheck, label: 'Risky interactions contained / year', value: compact(containedYr), tone: 'text-slate-900' },
    { icon: Rocket, label: 'Faster to safe launch', value: `${weeksSaved} wks`, tone: 'text-slate-900' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Business case</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-1">What governance is worth</h2>
          <p className="text-sm text-slate-500 mt-1">An illustrative model. Move the inputs to fit your portfolio.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shrink-0">
          {(['exec', 'tech'] as const).map((l) => (
            <button key={l} onClick={() => setLens(l)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${lens === l ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {l === 'exec' ? 'Executive' : 'Technical'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
              <Icon size={18} className="text-primary" />
              <p className={`text-2xl font-semibold mt-2 ${c.tone}`}>{c.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <p className="text-sm font-semibold text-slate-700">Your AI portfolio</p>
          <Slider label="Live AI use cases" value={useCases} set={setUseCases} min={1} max={50} step={1} fmt={(n) => `${n}`} />
          <Slider label="Prompts / use case / day" value={promptsPerDay} set={setPromptsPerDay} min={50} max={5000} step={50} fmt={compact} />
          <Slider label="Share that are risky" value={riskyPct} set={setRiskyPct} min={1} max={30} step={1} fmt={(n) => `${n}%`} />
          <Slider label="Auto containment rate" value={containment} set={setContainment} min={40} max={95} step={1} fmt={(n) => `${n}%`} />
          <Slider label="Analyst cost / hour" value={analystCost} set={setAnalystCost} min={40} max={200} step={5} fmt={usd} />
          <Slider label="Manual review time / item" value={minutesPerReview} set={setMinutesPerReview} min={5} max={60} step={1} fmt={(n) => `${n} min`} />
          <Slider label="Weeks saved to safe launch" value={weeksSaved} set={setWeeksSaved} min={0} max={26} step={1} fmt={(n) => `${n}`} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
          <p className="text-sm font-semibold text-slate-700">How the risky volume is handled</p>
          <p className="text-xs text-slate-500">{compact(riskyMonthly)} risky interactions / month, of which {containPct}% are contained automatically.</p>
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-emerald-700">Auto contained</span><span className="font-semibold">{compact(containedMonthly)}/mo</span></div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-2.5 bg-emerald-500" style={{ width: `${containPct}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-orange-700">Escalated to humans</span><span className="font-semibold">{compact(escalatedMonthly)}/mo</span></div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-2.5 bg-orange-500" style={{ width: `${100 - containPct}%` }} /></div>
            </div>
          </div>

          {lens === 'tech' && (
            <div className="pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
              <p>monthly_prompts = {compact(monthlyPrompts)} ({useCases} × {compact(promptsPerDay)} × {WORKDAYS}d)</p>
              <p>risky = monthly × {riskyPct}% = {compact(riskyMonthly)}</p>
              <p>contained = risky × {containment}% = {compact(containedMonthly)}</p>
              <p>hours_saved/yr = contained × {minutesPerReview}m / 60 × 12 = {compact(hoursSavedYr)}</p>
              <p>$ saved/yr = hours × {usd(analystCost)} = {usd(dollarsSavedYr)}</p>
            </div>
          )}
          <p className="text-[11px] text-slate-400 pt-1">Illustrative model for discussion, not a guarantee. Containment rate defaults to the platform&apos;s measured value (67%).</p>
        </div>
      </div>
    </div>
  );
}
