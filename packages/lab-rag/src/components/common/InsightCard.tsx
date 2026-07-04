import { cn } from "@rag/lib/cn";

const TONES = {
  info: "border-accent/30 bg-accent/[0.07]",
  warn: "border-amber-500/30 bg-amber-500/[0.07]",
  danger: "border-rose-500/30 bg-rose-500/[0.07]",
  success: "border-emerald-500/30 bg-emerald-500/[0.07]",
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
    <div className={cn("rounded-lg border p-4", TONES[tone], className)}>
      <div className="mb-1.5 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slatey-300" />}
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-slatey-300">{children}</div>
    </div>
  );
}
