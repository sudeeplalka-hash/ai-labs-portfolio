'use client';
/**
 * Lightweight RBAC for the demo, separation of duties without real auth.
 * A client side role store (persisted to localStorage) gates what each persona
 * can do, mirroring how an enterprise deployment would scope the control plane.
 */
import { useSyncExternalStore } from 'react';

export type Role = 'analyst' | 'reviewer' | 'auditor' | 'admin';

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: 'admin', label: 'Administrator', blurb: 'Full access across all functions.' },
  { id: 'analyst', label: 'AI Analyst', blurb: 'Registers use cases and runs the Playground; read only on governance.' },
  { id: 'reviewer', label: 'Governance Reviewer', blurb: 'Actions the Human Review Queue (approve / reject / escalate).' },
  { id: 'auditor', label: 'Risk & Audit', blurb: 'Verifies the audit chain and generates evidence; cannot alter reviews.' },
];

const PERMISSIONS: Record<Role, string[]> = {
  admin: ['playground:run', 'usecase:create', 'usecase:rescore', 'policy:toggle', 'review:act', 'audit:verify', 'evidence:generate'],
  analyst: ['playground:run', 'usecase:create', 'usecase:rescore'],
  reviewer: ['review:act', 'playground:run'],
  auditor: ['audit:verify', 'evidence:generate'],
};

const KEY = 'gov.role';
let current: Role = 'admin';
const listeners = new Set<() => void>();

function readRole(): Role {
  if (typeof window === 'undefined') return current;
  try { const saved = localStorage.getItem(KEY); return ROLES.some((role) => role.id === saved) ? saved as Role : current; }
  catch { return current; }
}

export function setRole(r: Role): void {
  current = r;
  if (typeof window !== 'undefined') { try { localStorage.setItem(KEY, r); } catch { /* Session-only role remains usable when persistence is unavailable. */ } }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useRole(): Role {
  return useSyncExternalStore(subscribe, readRole, () => current);
}

export function can(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function roleLabel(role: Role): string {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}
