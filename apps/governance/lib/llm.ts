'use client';
/**
 * Optional live model call (OpenAI-compatible). Returns the generated text, or
 * null on any failure so the caller falls back to the deterministic mock. The
 * key is read from local settings and sent only to the configured endpoint.
 */
import { getSettings, isLiveModel } from './settings';

export async function generateLive(prompt: string): Promise<string | null> {
  const s = getSettings();
  if (!isLiveModel(s)) return null;
  try {
    const res = await fetch(`${s.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.apiKey}` },
      body: JSON.stringify({
        model: s.model,
        messages: [
          { role: 'system', content: 'You are an enterprise AI assistant for a financial-services company. Answer concisely and professionally.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 220,
        temperature: 0.3,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
