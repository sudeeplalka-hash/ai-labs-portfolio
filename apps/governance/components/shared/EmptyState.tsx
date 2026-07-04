import { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, description }: {
  icon: LucideIcon; title: string; description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={40} className="text-slate-300 mb-4" />
      <p className="text-slate-500 font-medium">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
