'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@gov/lib/api';
import { USE_CASE_MODEL_OPTIONS } from '@labs/kit';

const FIELD_OPTIONS = {
  business_function: ['Finance', 'HR', 'Legal', 'Operations', 'Customer'],
  deployment_context: ['internal', 'customer-facing', 'agentic'],
  data_sensitivity: ['public', 'internal', 'confidential', 'regulated'],
  human_oversight: ['always', 'required', 'optional', 'none'],
  use_case_type: ['assistant', 'rag', 'agentic', 'classifier'],
  // Model names are dated config (§B5.6), not copy — sourced from @labs/kit.
  ai_model: USE_CASE_MODEL_OPTIONS,
};

export default function NewUseCase() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', description: '', business_function: 'Finance', owner: '',
    owner_email: '', ai_model: 'gpt-4o', deployment_context: 'internal',
    data_sensitivity: 'internal', human_oversight: 'required', use_case_type: 'assistant',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const uc = await api.useCases.create(form);
      router.push(`/use-cases/${uc.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register use case');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Use Case Registry</p>
      <h2 className="text-2xl font-bold text-slate-900 mt-1 mb-6">Register New AI Use Case</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-4">{error}</div>}

      <form onSubmit={submit} className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Basic Information</h3>
          {['name', 'description'].map(k => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{k}</label>
              {k === 'description' ? (
                <textarea className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20" value={(form as Record<string, string>)[k]} onChange={e => update(k, e.target.value)} required />
              ) : (
                <input className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={(form as Record<string, string>)[k]} onChange={e => update(k, e.target.value)} required />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {['owner', 'owner_email'].map(k => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{k === 'owner_email' ? 'Owner Email' : 'Owner Name'}</label>
                <input type={k === 'owner_email' ? 'email' : 'text'} className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={(form as Record<string, string>)[k]} onChange={e => update(k, e.target.value)} required />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Risk Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(FIELD_OPTIONS).map(([k, opts]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{k.replace(/_/g, ' ')}</label>
                <select className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={(form as Record<string, string>)[k]} onChange={e => update(k, e.target.value)}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Registering…' : 'Register & Score'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
        </div>
      </form>
    </div>
  );
}
