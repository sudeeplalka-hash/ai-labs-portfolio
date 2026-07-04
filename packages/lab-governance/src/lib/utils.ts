import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RISK_TIER_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  HIGH: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
  CRITICAL: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
};

export const DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  ALLOW_WITH_DISCLAIMER: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  REDACT: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
  REWRITE: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  REQUIRE_CONFIRMATION: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  ESCALATE: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
  BLOCK: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  LOG_ONLY: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
};

export const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
  low: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
  critical: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function riskScoreColor(score: number) {
  if (score >= 0.75) return 'text-red-600';
  if (score >= 0.5) return 'text-orange-600';
  if (score >= 0.25) return 'text-amber-600';
  return 'text-emerald-600';
}
