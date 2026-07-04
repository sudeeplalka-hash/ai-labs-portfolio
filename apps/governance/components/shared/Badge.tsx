import { cn, RISK_TIER_COLORS, DECISION_COLORS, SEVERITY_COLORS } from '@/lib/utils';

export function RiskBadge({ tier }: { tier: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold', RISK_TIER_COLORS[tier] ?? 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20')}>
      {tier}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold', DECISION_COLORS[decision] ?? 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20')}>
      {decision.replace(/_/g, ' ')}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', SEVERITY_COLORS[severity] ?? 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-600/20')}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    draft: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
    suspended: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    retired: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    in_review: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    false_positive: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20',
    completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    running: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    pass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    fail: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    error: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', colors[status] ?? 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
