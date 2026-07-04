"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Sparkles, Cpu } from "lucide-react";
import { cn } from "@rag/lib/cn";
import { PROVIDERS, providerMeta, type LlmConfig, type LlmProviderId } from "@rag/lib/live-lab/llmProvider";
import type { Engine } from "./AnswerEngineSettings";

interface Props {
  engine: Engine;
  config: LlmConfig | null;
  onSave: (engine: Engine, config: LlmConfig | null) => void;
  onClear: () => void;
}

// Inline answer-engine selector. The two choices (Simulated / Bring your own API
// key) are surfaced directly as tabs — no separate "Configure" step or modal.
// Picking Simulated applies instantly; picking Bring your own reveals the key form
// right here.
export function AnswerEnginePanel({ engine, config, onSave, onClear }: Props) {
  const [mode, setMode] = useState<Engine>(engine);
  const [provider, setProvider] = useState<LlmProviderId>(config?.provider ?? "openai");
  const [model, setModel] = useState(config?.model ?? providerMeta(config?.provider ?? "openai").defaultModel);
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = providerMeta(provider);
  const active = engine === "llm" && config ? `${providerMeta(config.provider).label} · ${config.model}` : "Simulated · no key";

  const pickSimulated = () => { setMode("simulated"); setError(null); onSave("simulated", config); };
  const pickByo = () => { setMode("llm"); setError(null); };
  const onPickProvider = (id: LlmProviderId) => { setProvider(id); setModel(providerMeta(id).defaultModel); };

  const save = () => {
    if (!apiKey.trim()) return setError("Enter your API key.");
    if (!model.trim()) return setError("Enter a model name.");
    if (meta.needsBaseUrl && !baseUrl.trim()) return setError("Enter the base URL for your OpenAI-compatible endpoint.");
    setError(null);
    onSave("llm", { provider, apiKey: apiKey.trim(), model: model.trim(), baseUrl: baseUrl.trim() || undefined });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2">
        <span className="inline-flex items-center gap-2 text-slatey-300">
          {engine === "llm" && config ? <Cpu className="h-4 w-4 text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
          Answer engine:
          <span className="font-medium text-ink">{active}</span>
        </span>
        <div className="inline-flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Answer engine">
          <button
            onClick={pickSimulated}
            aria-pressed={mode === "simulated"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              mode === "simulated" ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" /> Simulated
          </button>
          <button
            onClick={pickByo}
            aria-pressed={mode === "llm"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              mode === "llm" ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
            )}
          >
            <Cpu className="h-3.5 w-3.5" /> Bring your own API key
          </button>
        </div>
      </div>

      {mode === "simulated" ? (
        <p className="px-3.5 py-2.5 text-xs leading-relaxed text-slatey-400">
          Deterministic, in-browser answers with no API key. Great for exploring exactly how retrieval, generation, and
          evaluation work. Switch to your own API key any time for real model output, grounded in the same retrieval.
        </p>
      ) : (
        <div className="space-y-3 px-3.5 py-3">
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
              Your key is stored only in <span className="font-medium text-ink">this browser</span> and sent <span className="font-medium text-ink">directly</span> to {meta.label} —
              never to us or any server. Calls are made from your browser, so the provider must allow direct browser (CORS) access.
              {meta.docs && <> Get a key at {meta.docs}.</>}
            </span>
          </div>

          {error && <p className="text-xs font-medium text-rose-700">{error}</p>}

          <div className="flex items-center justify-between gap-2">
            {config ? (
              <button onClick={onClear} className="text-xs font-medium text-rose-700 hover:underline">Remove saved key</button>
            ) : <span />}
            <button onClick={save} className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark">Save &amp; use</button>
          </div>
        </div>
      )}
    </div>
  );
}
