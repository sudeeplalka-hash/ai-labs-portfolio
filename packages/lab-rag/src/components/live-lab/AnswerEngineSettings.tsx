"use client";

import { useState } from "react";
import { X, Eye, EyeOff, ShieldCheck, Sparkles, Cpu } from "lucide-react";
import { cn } from "@rag/lib/cn";
import { PROVIDERS, providerMeta, type LlmConfig, type LlmProviderId } from "@rag/lib/live-lab/llmProvider";

export type Engine = "simulated" | "llm";

interface Props {
  open: boolean;
  engine: Engine;
  config: LlmConfig | null;
  onClose: () => void;
  onSave: (engine: Engine, config: LlmConfig | null) => void;
  onClear: () => void;
}

export function AnswerEngineSettings({ open, engine, config, onClose, onSave, onClear }: Props) {
  const [mode, setMode] = useState<Engine>(engine);
  const [provider, setProvider] = useState<LlmProviderId>(config?.provider ?? "openai");
  const [model, setModel] = useState(config?.model ?? providerMeta(config?.provider ?? "openai").defaultModel);
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const meta = providerMeta(provider);

  const onPickProvider = (id: LlmProviderId) => {
    setProvider(id);
    setModel(providerMeta(id).defaultModel);
  };

  const save = () => {
    if (mode === "simulated") {
      onSave("simulated", config);
      onClose();
      return;
    }
    if (!apiKey.trim()) return setError("Enter your API key.");
    if (!model.trim()) return setError("Enter a model name.");
    if (meta.needsBaseUrl && !baseUrl.trim()) return setError("Enter the base URL for your OpenAI-compatible endpoint.");
    onSave("llm", { provider, apiKey: apiKey.trim(), model: model.trim(), baseUrl: baseUrl.trim() || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-line bg-white shadow-cardhover">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Answer engine</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slatey-400 hover:bg-slate-100 hover:text-ink" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Mode choice */}
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => setMode("simulated")}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                mode === "simulated" ? "border-primary/50 bg-primary/[0.06] ring-1 ring-inset ring-primary/20" : "border-line hover:bg-slate-50",
              )}
            >
              <Sparkles className={cn("mt-0.5 h-4 w-4 shrink-0", mode === "simulated" ? "text-primary" : "text-slatey-400")} />
              <span>
                <span className="block text-sm font-medium text-ink">Simulated</span>
                <span className="block text-xs text-slatey-400">Deterministic, in browser. No key.</span>
              </span>
            </button>
            <button
              onClick={() => setMode("llm")}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                mode === "llm" ? "border-primary/50 bg-primary/[0.06] ring-1 ring-inset ring-primary/20" : "border-line hover:bg-slate-50",
              )}
            >
              <Cpu className={cn("mt-0.5 h-4 w-4 shrink-0", mode === "llm" ? "text-primary" : "text-slatey-400")} />
              <span>
                <span className="block text-sm font-medium text-ink">Bring your own API key</span>
                <span className="block text-xs text-slatey-400">Real LLM, grounded in retrieval.</span>
              </span>
            </button>
          </div>

          {mode === "llm" && (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slatey-300">Provider</span>
                <select
                  value={provider}
                  onChange={(e) => onPickProvider(e.target.value as LlmProviderId)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slatey-300">Model</span>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={meta.defaultModel || "model name"}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slatey-500 focus:border-primary/50 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slatey-300">API key</span>
                  <span className="relative block">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={meta.keyHint}
                      autoComplete="off"
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 pr-9 text-sm text-ink placeholder:text-slatey-500 focus:border-primary/50 focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-2 text-slatey-400 hover:text-ink" aria-label={showKey ? "Hide key" : "Show key"}>
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
              </div>

              {meta.needsBaseUrl && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slatey-300">Base URL</span>
                  <input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slatey-500 focus:border-primary/50 focus:outline-none"
                  />
                </label>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-line bg-slate-50 p-3 text-xs leading-relaxed text-slatey-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Your key is stored only in <span className="font-medium text-ink">this browser</span> and sent <span className="font-medium text-ink">directly</span> to {meta.label}, never to us or any server. Calls are made from your browser, so the provider must allow direct browser (CORS) access.
                  {meta.docs && <> Get a key at {meta.docs}.</>}
                </span>
              </div>

              {error && <p className="text-xs font-medium text-rose-700">{error}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line bg-slate-50 px-5 py-3">
          {config ? (
            <button onClick={() => { onClear(); onClose(); }} className="text-xs font-medium text-rose-700 hover:underline">
              Remove saved key
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm text-slatey-300 hover:bg-white">Cancel</button>
            <button onClick={save} className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark">Save &amp; use</button>
          </div>
        </div>
      </div>
    </div>
  );
}
