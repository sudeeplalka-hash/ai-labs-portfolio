'use client';
/**
 * Audience lens, one global switch that changes information density everywhere.
 * 'exec' shows plain-English outcomes; 'tech' reveals guardrail internals,
 * confidence, traces and hashes. Same data, two readings.
 */
import { useSyncExternalStore } from 'react';

export type Lens = 'exec' | 'tech';

const KEY = 'gov.lens';
let current: Lens = 'exec';
const listeners = new Set<() => void>();

function read(): Lens {
  if (typeof window === 'undefined') return current;
  return (localStorage.getItem(KEY) as Lens) || current;
}
export function setLens(l: Lens): void {
  current = l;
  if (typeof window !== 'undefined') localStorage.setItem(KEY, l);
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function useLens(): Lens {
  return useSyncExternalStore(subscribe, read, () => current);
}
