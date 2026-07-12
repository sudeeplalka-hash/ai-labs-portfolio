'use client';
import { useSettings, setSettings, isLiveModel } from '@gov/lib/settings';
import { KeyRound, ShieldCheck, Cpu, Info } from 'lucide-react';

export default function Settings() {
  const s = useSettings();
  const live = isLiveModel(s);

  return (
    <div className="p-8 max-w-[760px] space-y-6">
      <div>
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Settings</p>
        <h2 className="text-2xl font-semibold text-slate-900 mt-1">Model &amp; connection</h2>
        <p className="text-sm text-slate-500 mt-1">Run the lab on deterministic mock responses, or bring your own key to govern a real model.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-primary" />
            <span className="text-sm font-semibold text-slate-800">Model provider</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ring-inset ${live ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-slate-500/15'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {live ? 'Live model active' : 'Mock mode'}
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
          {(['mock', 'openai'] as const).map((p) => (
            <button key={p} onClick={() => setSettings({ provider: p })}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${s.provider === p ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
              {p === 'mock' ? 'Deterministic mock' : 'OpenAI-compatible'}
            </button>
          ))}
        </div>

        {s.provider === 'openai' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-600">API base URL</label>
              <input value={s.baseUrl} onChange={(e) => setSettings({ baseUrl: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Model</label>
              <input value={s.model} onChange={(e) => setSettings({ model: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
            <div>
              <label className="text-sm text-slate-600 flex items-center gap-1.5"><KeyRound size={13} /> API key</label>
              <input type="password" value={s.apiKey} onChange={(e) => setSettings({ apiKey: e.target.value })}
                placeholder="sk-…" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 ring-1 ring-inset ring-blue-600/10 rounded-xl p-4 flex gap-3">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 space-y-1.5">
          <p className="font-medium">How your key is handled</p>
          <p className="text-blue-800/90">When you add a key, the Runtime Playground sends the prompt directly from your browser to the endpoint you specify, the key is stored only in this browser&apos;s local storage and never reaches this app&apos;s host. The eight governance guardrails then run on the <em>real</em> model&apos;s output, exactly as in mock mode. If a call fails, the lab falls back to the deterministic mock automatically.</p>
          <p className="flex items-center gap-1.5 text-blue-800/90"><ShieldCheck size={14} /> In a production deployment the key lives server side, never in the browser.</p>
        </div>
      </div>
    </div>
  );
}
