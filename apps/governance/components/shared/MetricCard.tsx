import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'red' | 'amber' | 'green' | 'blue';
}

const colorMap = {
  default: 'text-slate-900',
  red: 'text-red-600',
  amber: 'text-amber-600',
  green: 'text-emerald-600',
  blue: 'text-blue-600',
};

export function MetricCard({ label, value, sub, icon: Icon, color = 'default' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={16} className="text-slate-400" />}
      </div>
      <p className={cn('text-3xl font-bold', colorMap[color])}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
