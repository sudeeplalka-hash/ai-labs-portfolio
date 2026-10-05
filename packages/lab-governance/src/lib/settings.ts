'use client';
/**
 * Bring-your-own-key model settings (client side, demo only).
 * The key is stored in this browser's localStorage and sent ONLY to the model
 * endpoint you configure, never to this app's host. Default is deterministic
 * mock mode, so the lab works with no key.
 */
import { useSyncExternalStore } from 'react';

export interface ModelSettings {
  provider: 'mock' | 'openai';
  baseUrl: string;
  model: string;
  apiKey: string;
}

const DEFAULTS: ModelSettings = { provider: 'mock', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: '' };
const KEY = 'gov.model';
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSettings: ModelSettings = DEFAULTS;

function read(): ModelSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedSettings = { ...DEFAULTS, ...JSON.parse(raw || '{}') };
    }
    return cachedSettings;
  } catch { return cachedSettings; }
}
export function getSettings(): ModelSettings { return read(); }
export function setSettings(patch: Partial<ModelSettings>): boolean {
  const next = { ...read(), ...patch };
  try { if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { return false; }
  listeners.forEach((f) => f());
  return true;
}
function subscribe(f: () => void): () => void {
  listeners.add(f);
  const changed = (event: StorageEvent) => { if (event.key === KEY || event.key === null) f(); };
  window.addEventListener('storage', changed);
  return () => { listeners.delete(f); window.removeEventListener('storage', changed); };
}
export function useSettings(): ModelSettings { return useSyncExternalStore(subscribe, read, () => DEFAULTS); }
export function isLiveModel(s: ModelSettings = read()): boolean { return s.provider === 'openai' && s.apiKey.trim().length > 0; }
