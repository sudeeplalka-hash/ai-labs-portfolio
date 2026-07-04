import { cn } from "@data/lib/cn";

export type BadgeColor =
  | "emerald"
  | "amber"
  | "orange"
  | "rose"
  | "blue"
  | "cyan"
  | "violet"
  | "slate";

// Lab Suite badge formula: soft -50 tint + -700 text + ring-1 ring-inset ring-<c>-600/20.
const STYLES: Record<BadgeColor, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-400/20",
};

export function Badge({
  children,
  color = "slate",
  className,
}: {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
