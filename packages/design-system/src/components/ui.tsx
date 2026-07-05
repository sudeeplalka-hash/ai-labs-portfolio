import {
  SearchX, Lightbulb, AlertTriangle, ShieldAlert, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Minus, Radio, CircleDot, type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";
import { MetricTooltip } from "./ui-client";
import { formatStampDate, isStale, type Freshness, type LiveMode } from "@labs/kit";

/* ---------------- Panel ---------------- */
export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("panel p-5 animate-fade-in", className)}>{children}</section>;
}

/* ---------------- SectionHeader ---------------- */
export function SectionHeader({
  title, description, eyebrow, icon: Icon, action, className,
}: {
  title: string; description?: string; eyebrow?: string;
  icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slatey-400">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ---------------- Badge ---------------- */
const BADGE_TONES = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  blue: "bg-primary-soft text-primary-dark ring-primary/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-400/20",
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;
export function Badge({ children, tone = "slate", className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
      <SearchX className="h-6 w-6 text-slatey-500" />
      <p className="text-sm text-slatey-400">{message}</p>
    </div>
  );
}

/* ---------------- ScoreBar ---------------- */
export function ScoreBar({
  value, max = 100, target, mode = "higher-better", className,
}: { value: number; max?: number; target?: number; mode?: "higher-better" | "lower-better"; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  let color = "bg-emerald-500";
  if (mode === "higher-better") {
    if (target !== undefined) {
      if (value < target - 12) color = "bg-rose-500";
      else if (value < target - 5) color = "bg-orange-500";
      else if (value < target) color = "bg-amber-500";
    } else if (value < 60) color = "bg-rose-500";
    else if (value < 80) color = "bg-amber-500";
  } else if (target !== undefined) {
    if (value > target * 1.4) color = "bg-rose-500";
    else if (value > target * 1.15) color = "bg-orange-500";
    else if (value > target) color = "bg-amber-500";
  }
  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
        {target !== undefined && (
          <div className="absolute top-0 h-full w-px bg-ink/40" style={{ left: `${Math.min(100, (target / max) * 100)}%` }} title={`Target ${target}`} />
        )}
      </div>
    </div>
  );
}

/* ---------------- InsightCard ---------------- */
const INSIGHT_TONES: Record<string, { wrap: string; Icon: LucideIcon; icon: string }> = {
  info: { wrap: "border-primary/30 bg-primary/[0.06]", Icon: Lightbulb, icon: "text-primary" },
  warn: { wrap: "border-amber-500/30 bg-amber-500/[0.07]", Icon: AlertTriangle, icon: "text-amber-600" },
  danger: { wrap: "border-rose-500/30 bg-rose-500/[0.07]", Icon: ShieldAlert, icon: "text-rose-600" },
  success: { wrap: "border-emerald-500/30 bg-emerald-500/[0.07]", Icon: CheckCircle2, icon: "text-emerald-600" },
};
export function InsightCard({ title, tone = "info", children, className }: { title: string; tone?: keyof typeof INSIGHT_TONES; children: React.ReactNode; className?: string }) {
  const cfg = INSIGHT_TONES[tone]; const Icon = cfg.Icon;
  return (
    <div className={cn("rounded-lg border p-4", cfg.wrap, className)}>
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", cfg.icon)} />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-slatey-300">{children}</div>
    </div>
  );
}

/* ---------------- TrendIndicator ---------------- */
export function TrendIndicator({
  direction, value, suffix = "", goodWhen = "up", className,
}: { direction: "up" | "down" | "flat"; value?: number; suffix?: string; goodWhen?: "up" | "down"; className?: string }) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const isGood = direction === "flat" ? null : direction === goodWhen;
  const color = isGood === null ? "text-slatey-400" : isGood ? "text-emerald-700" : "text-rose-700";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", color, className)}>
      <Icon className="h-3.5 w-3.5" />
      {value !== undefined && (<span>{value > 0 ? "+" : ""}{value}{suffix}</span>)}
    </span>
  );
}

/* ---------------- KpiCard ---------------- */
type KpiTone = "healthy" | "watch" | "risk" | "critical" | "neutral";
const KPI_ACCENT: Record<KpiTone, string> = {
  healthy: "bg-emerald-500", watch: "bg-amber-500", risk: "bg-orange-500", critical: "bg-rose-500", neutral: "bg-slate-300",
};
const SPARK_STROKE: Record<KpiTone, string> = {
  healthy: "#16a34a", watch: "#d97706", risk: "#ea580c", critical: "#e11d48", neutral: "#94a3b8",
};

// Tiny inline sparkline (no axes) — compresses a short series into the card so the
// KPI shows its direction of travel, not just today's number. Pure SVG, no hooks.
function Sparkline({ data, tone = "neutral" }: { data: number[]; tone?: KpiTone }) {
  if (!data || data.length < 2) return null;
  const w = 68, h = 20, p = 2;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const x = (i: number) => p + (i / (data.length - 1)) * (w - p * 2);
  const y = (v: number) => h - p - ((v - min) / span) * (h - p * 2);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lx = x(data.length - 1), ly = y(data[data.length - 1]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline points={pts} fill="none" stroke={SPARK_STROKE[tone]} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="1.8" fill={SPARK_STROKE[tone]} />
    </svg>
  );
}

export interface KpiTrend { direction: "up" | "down" | "flat"; value?: number; suffix?: string; goodWhen?: "up" | "down"; }

export function KpiCard({
  label, value, suffix, tone = "neutral", target, tooltip, interpretation, spark, trend,
}: {
  label: string; value: string | number; suffix?: string; tone?: KpiTone;
  target?: string; tooltip?: string; interpretation?: string;
  spark?: number[]; trend?: KpiTrend;
}) {
  return (
    <div className="panel panel-hover relative flex flex-col gap-2 p-4 pt-[18px] animate-fade-in">
      <span className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", KPI_ACCENT[tone])} />
      <div className="flex items-center gap-1.5">
        <span className="stat-label">{label}</span>
        {tooltip && <MetricTooltip text={tooltip} />}
        {spark && <span className="ml-auto"><Sparkline data={spark} tone={tone} /></span>}
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-ink">{value}</span>
        {suffix && <span className="pb-0.5 text-sm text-slatey-400">{suffix}</span>}
        {trend && <span className="pb-0.5"><TrendIndicator {...trend} /></span>}
      </div>
      {target && <div className="text-[11px] text-slatey-500">{target}</div>}
      {interpretation && <p className="text-xs leading-relaxed text-slatey-400">{interpretation}</p>}
    </div>
  );
}

/* ---------------- PageIntro ---------------- */
export function PageIntro({
  eyebrow, title, icon: Icon, children,
}: {
  eyebrow?: string; title: string; icon?: React.ComponentType<{ className?: string }>; children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 animate-fade-in">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      {children && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">{children}</p>}
    </div>
  );
}

/* ---------------- FreshnessStamp ---------------- */
// "last verified" / "as of" stamp (§A4.4, §B3). Dates come from @labs/kit, never
// from copy. Flags itself when stale so the quarterly sweep is visible.
export function FreshnessStamp({ freshness, className }: { freshness: Freshness; className?: string }) {
  const stale = isStale(freshness.lastVerified);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] text-slatey-500",
        stale && "text-amber-600",
        className,
      )}
      title={freshness.note}
    >
      <CircleDot className="h-3 w-3" />
      Verified {formatStampDate(freshness.lastVerified)}
      {freshness.asOf && <span className="text-slatey-400">· data as of {formatStampDate(freshness.asOf)}</span>}
      {stale && <span className="font-semibold">· review due</span>}
    </span>
  );
}

/* ---------------- LiveBadge ---------------- */
// LIVE vs SIMULATED, rendered honestly and identically everywhere (§B3, §A4.4).
export function LiveBadge({ mode, className }: { mode: LiveMode; className?: string }) {
  const isLive = mode === "LIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        isLive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/30" : "bg-slate-100 text-slate-600 ring-slate-400/30",
        className,
      )}
    >
      <Radio className={cn("h-3 w-3", isLive && "animate-pulse")} />
      {mode}
    </span>
  );
}
