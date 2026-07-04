import { cn } from "@data/lib/cn";

const TONES = {
  info: "border-blue-200 bg-blue-50/70",
  warn: "border-amber-200 bg-amber-50/70",
  danger: "border-rose-200 bg-rose-50/70",
  success: "border-emerald-200 bg-emerald-50/70",
};

const ICON_TONE = {
  info: "text-blue-600",
  warn: "text-amber-600",
  danger: "text-rose-600",
  success: "text-emerald-600",
};

export function InsightCard({
  title,
  icon: Icon,
  tone = "info",
  children,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4", TONES[tone], className)}>
      <div className="mb-1.5 flex items-center gap-2">
        {Icon && <Icon className={cn("h-4 w-4", ICON_TONE[tone])} />}
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="text-[13px] leading-relaxed text-slatey-200">{children}</div>
    </div>
  );
}
