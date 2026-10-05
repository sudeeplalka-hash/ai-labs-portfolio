import { type ReactNode } from "react";
import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "../lib/cn";

export interface Breadcrumb { label: string; href?: string; }
export interface InstrumentShellProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  decision?: ReactNode;
  provenance?: ReactNode;
  controls?: ReactNode;
  actions?: ReactNode;
  method?: ReactNode;
  related?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function InstrumentShell({ title, eyebrow, description, breadcrumbs = [{ label: "Portfolio", href: "/" }], decision, provenance, controls, actions, method, related, children, className }: InstrumentShellProps) {
  return <div className={cn("min-h-screen bg-canvas text-ink", className)}>
    <a href="#instrument-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white">Skip to decision</a>
    <header className="no-print border-b border-line bg-white">
      <nav aria-label="Breadcrumb" className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 text-sm md:px-6">
        {breadcrumbs.map((crumb, index) => <span key={`${crumb.label}-${index}`} className="inline-flex min-w-0 items-center gap-2">
          {index > 0 && <ChevronRight aria-hidden className="h-3 w-3 shrink-0 text-slatey-500" />}
          {crumb.href ? <a href={crumb.href} className="rounded py-1 text-slatey-400 underline-offset-4 hover:text-primary hover:underline">{crumb.label}</a> : <span aria-current="page">{crumb.label}</span>}
        </span>)}
      </nav>
    </header>
    <main id="instrument-main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 focus:outline-none md:px-6 md:py-8">
      <div className="mb-6 max-w-4xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{title}</h1>
        {description && <div className="mt-3 max-w-3xl text-sm leading-relaxed text-slatey-400 md:text-base">{description}</div>}
      </div>
      {provenance && <div className="mb-4">{provenance}</div>}
      {decision && <div className="mb-5">{decision}</div>}
      {(controls || actions) && <div className="no-print mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line bg-white p-3"><div className="min-w-0 flex-1">{controls}</div>{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}</div>}
      <div className="min-w-0">{children}</div>
      {method && <details className="mt-8 rounded-xl border border-line bg-white p-4 print:break-inside-avoid"><summary className="cursor-pointer py-1 font-semibold">Method, evidence and limitations</summary><div className="mt-4 space-y-3 text-sm leading-relaxed text-slatey-300">{method}</div></details>}
      {related && <aside aria-label="Continue exploring" className="mt-8 border-t border-line pt-5">{related}</aside>}
    </main>
  </div>;
}

export interface DecisionSummaryProps {
  label?: string;
  title: ReactNode;
  explanation?: ReactNode;
  nextAction?: ReactNode;
  metrics?: { label: string; value: ReactNode; detail?: ReactNode }[];
  tone?: "neutral" | "positive" | "caution" | "negative";
  children?: ReactNode;
}
export function DecisionSummary({ label = "Current decision", title, explanation, nextAction, metrics = [], tone = "neutral", children }: DecisionSummaryProps) {
  const edge = { neutral: "border-l-primary", positive: "border-l-emerald-700", caution: "border-l-amber-700", negative: "border-l-rose-700" }[tone];
  return <section aria-label={label} className={cn("rounded-xl border border-line border-l-4 bg-white p-5 shadow-card", edge)}>
    <p className="text-xs font-semibold uppercase tracking-wide text-slatey-500">{label}</p>
    <h2 className="mt-2 text-xl font-semibold leading-snug tracking-tight md:text-2xl">{title}</h2>
    {explanation && <div className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-300">{explanation}</div>}
    {metrics.length > 0 && <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((metric) => <div key={metric.label}><dt className="text-xs text-slatey-500">{metric.label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</dd>{metric.detail && <dd className="mt-1 text-xs leading-relaxed text-slatey-400">{metric.detail}</dd>}</div>)}</dl>}
    {nextAction && <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary-dark"><ArrowRight aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><div>{nextAction}</div></div>}
    {children}
  </section>;
}

export interface ProvenanceProps {
  mode: string;
  input?: string;
  method?: string;
  verified?: string;
  sources?: { label: string; href: string }[];
  note?: ReactNode;
}
export function Provenance({ mode, input, method, verified, sources = [], note }: ProvenanceProps) {
  return <aside aria-label="Result provenance" className="rounded-lg border border-line bg-white px-3 py-2.5 text-xs leading-relaxed text-slatey-400">
    <dl className="flex flex-wrap gap-x-4 gap-y-1.5">
      <div className="flex gap-1"><dt className="font-semibold text-ink">Execution:</dt><dd>{mode}</dd></div>
      {input && <div className="flex gap-1"><dt className="font-semibold text-ink">Inputs:</dt><dd>{input}</dd></div>}
      {method && <div className="flex gap-1"><dt className="font-semibold text-ink">Method:</dt><dd>{method}</dd></div>}
      {verified && <div className="flex gap-1"><dt className="font-semibold text-ink">Evidence checked:</dt><dd><time dateTime={verified}>{verified}</time></dd></div>}
    </dl>
    {sources.length > 0 && <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{sources.map((source) => <li key={source.href}><a href={source.href} className="inline-flex items-center gap-1 rounded text-primary underline underline-offset-2">{source.label}<ExternalLink aria-hidden className="h-3 w-3" /></a></li>)}</ul>}
    {note && <div className="mt-2">{note}</div>}
  </aside>;
}
