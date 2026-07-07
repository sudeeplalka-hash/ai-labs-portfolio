import type { AnswerGenerator } from "./answerGeneration";
import type { GeneratedLiveAnswer, RetrievedLiveChunk } from "@rag/types/liveLab";
import { PROVIDER_DEFAULT_MODEL } from "@labs/kit";

// Bring-your-own-key LLM answer generation. Runs entirely in the browser, the
// user's key is sent directly to the chosen provider and never to any server.

export type LlmProviderId = "openai" | "anthropic" | "gemini" | "openai-compatible";

export interface LlmConfig {
  provider: LlmProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string; // for openai-compatible
}

export interface ProviderMeta {
  id: LlmProviderId;
  label: string;
  defaultModel: string;
  needsBaseUrl: boolean;
  keyHint: string;
  docs: string;
}

// Provider default models are sourced from @labs/kit (dated config, §B2/§B5.6) so
// no model string is hardcoded in a lab. The visitor can still override per call.
export const PROVIDERS: ProviderMeta[] = [
  { id: "openai", label: "OpenAI", defaultModel: PROVIDER_DEFAULT_MODEL.openai, needsBaseUrl: false, keyHint: "sk-…", docs: "platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic (Claude)", defaultModel: PROVIDER_DEFAULT_MODEL.anthropic, needsBaseUrl: false, keyHint: "sk-ant-…", docs: "console.anthropic.com" },
  { id: "gemini", label: "Google Gemini", defaultModel: PROVIDER_DEFAULT_MODEL.gemini, needsBaseUrl: false, keyHint: "AIza…", docs: "aistudio.google.com/apikey" },
  { id: "openai-compatible", label: "OpenAI compatible (Groq, OpenRouter, local…)", defaultModel: PROVIDER_DEFAULT_MODEL["openai-compatible"], needsBaseUrl: true, keyHint: "your key", docs: "" },
];

export function providerMeta(id: LlmProviderId): ProviderMeta {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

export class LlmError extends Error {}

const SYSTEM =
  "You are a careful retrieval augmented assistant. Answer the user's question using ONLY the numbered context passages provided. " +
  "Cite the passages you rely on inline using their labels, like [C1] or [C2]. Keep the answer concise (2 to 4 sentences). " +
  "If the passages do not contain the answer, say you couldn't find it in the document, do not use outside knowledge.";

function buildUser(question: string, chunks: RetrievedLiveChunk[]): string {
  const context = chunks.map((c) => `[${c.citationLabel}] ${c.text}`).join("\n\n");
  return `Question: ${question}\n\nContext passages:\n${context}\n\nAnswer (use inline [C#] citations):`;
}

function parseCitations(answer: string, chunks: RetrievedLiveChunk[]): string[] {
  const labels = new Set(chunks.map((c) => c.citationLabel));
  const found = [...answer.matchAll(/\[(C\d+)\]/g)].map((m) => m[1]).filter((l) => labels.has(l));
  return [...new Set(found)];
}

async function fetchJson(url: string, init: RequestInit, label: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof DOMException && e.name === "AbortError") throw new LlmError(`${label} request timed out.`);
    throw new LlmError(`Couldn't reach ${label} from the browser. The provider may block direct browser calls (CORS), or you're offline.`);
  }
  clearTimeout(timeout);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) throw new LlmError(`Invalid or unauthorized API key for ${label}.`);
    if (res.status === 429) throw new LlmError(`Rate limited by ${label}. Try again shortly.`);
    throw new LlmError(`${label} error ${res.status}: ${body.slice(0, 160)}`);
  }
  return res.json();
}

async function callOpenAi(cfg: LlmConfig, question: string, chunks: RetrievedLiveChunk[], label: string): Promise<string> {
  const base = (cfg.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const data = await fetchJson(
    `${base}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildUser(question, chunks) },
        ],
      }),
    },
    label,
  );
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callAnthropic(cfg: LlmConfig, question: string, chunks: RetrievedLiveChunk[], label: string): Promise<string> {
  const data = await fetchJson(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 500,
        temperature: 0.2,
        system: SYSTEM,
        messages: [{ role: "user", content: buildUser(question, chunks) }],
      }),
    },
    label,
  );
  return (data?.content?.[0]?.text ?? "").trim();
}

async function callGemini(cfg: LlmConfig, question: string, chunks: RetrievedLiveChunk[], label: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const data = await fetchJson(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: buildUser(question, chunks) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
    },
    label,
  );
  return (data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join(" ") ?? "").trim();
}

export class LlmAnswerGenerator implements AnswerGenerator {
  constructor(private cfg: LlmConfig) {}

  async generateAnswer({ question, retrievedChunks }: { question: string; retrievedChunks: RetrievedLiveChunk[] }): Promise<GeneratedLiveAnswer> {
    const meta = providerMeta(this.cfg.provider);
    const chunks = retrievedChunks.slice(0, 6);
    let text: string;
    switch (this.cfg.provider) {
      case "anthropic":
        text = await callAnthropic(this.cfg, question, chunks, meta.label);
        break;
      case "gemini":
        text = await callGemini(this.cfg, question, chunks, meta.label);
        break;
      default:
        text = await callOpenAi(this.cfg, question, chunks, meta.label);
        break;
    }
    if (!text) throw new LlmError(`${meta.label} returned an empty response.`);
    return {
      answer: text,
      citations: parseCitations(text, chunks),
      mode: "llm",
      caveats: [
        `Generated by ${meta.label} (${this.cfg.model}) from the retrieved passages.`,
        "If the most relevant passage wasn't retrieved, the answer may be incomplete.",
      ],
    };
  }
}

export function getLlmGenerator(cfg: LlmConfig): LlmAnswerGenerator {
  return new LlmAnswerGenerator(cfg);
}

// --- Persistence (localStorage, browser only) ---
const LS_KEY = "rag-live-lab-llm-v1";

export function loadLlmConfig(): LlmConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as LlmConfig) : null;
  } catch {
    return null;
  }
}

export function saveLlmConfig(cfg: LlmConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

export function clearLlmConfig(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}
