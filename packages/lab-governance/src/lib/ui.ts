'use client';
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

export function setSidebarOpen(v: boolean): void { open = v; emit(); }
export function toggleSidebar(): void { open = !open; emit(); }
function subscribe(f: () => void): () => void { listeners.add(f); return () => listeners.delete(f); }
export function useSidebarOpen(): boolean { return useSyncExternalStore(subscribe, () => open, () => open); }
