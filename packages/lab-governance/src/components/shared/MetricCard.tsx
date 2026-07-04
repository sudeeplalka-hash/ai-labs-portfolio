import { cn } from '@gov/lib/utils';
import { Info, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'red' | 'amber' | 'green' | 'blue';
  tooltip?: string;
}

const colorMap = {
  default: 'text-slate-900',
  red: 'text-red-600',
  amber: 'text-amber-600',
  green: 'text-emerald-600',
  blue: 'text-blue-600',
};

export function MetricCard({ label, value, sub, icon: Icon, color = 'default', tooltip }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          {tooltip && (
            <span className="group relative inline-flex">
              <button type="button" aria-label="More information" className="text-slate-400 transition-colors hover:text-slate-600">
                <Info size={13} />
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-500 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        {Icon && <Icon size={16} className="text-slate-400" />}
      </div>
      <p className={cn('text-3xl font-bold', colorMap[color])}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
