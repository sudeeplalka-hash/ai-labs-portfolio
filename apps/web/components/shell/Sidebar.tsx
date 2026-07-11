"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Database, Boxes, Rocket, ShieldCheck, TrendingUp, RefreshCcw, Lock, Check, BookOpen, type LucideIcon,
} from "lucide-react";
import { useProgram, STAGES, type StageKey, type StageStatus } from "@labs/program-core";
import { cn } from "@labs/design-system";

const ICONS: Record<StageKey, LucideIcon> = {
  frame: Compass, data: Database, build: Boxes, deploy: Rocket, govern: ShieldCheck, realize: TrendingUp, operate: RefreshCcw,
};

// The rail is a pure stage switcher: each lab owns its navigation in-page
// (BuildSubnav / DataSubnav / GovSubnav and the stage heroes), the way the
// standalone Live Builds apps own theirs. Density lives in the lab, not here.

function Dot({ status }: { status: StageStatus }) {
  return (
    <span className={cn(
      "h-2 w-2 shrink-0 rounded-full",
      status === "done" ? "bg-emerald-400" : status === "active" ? "bg-sky-400 ring-4 ring-sky-400/20" : "bg-slate-600",
    )} />
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, portfolio } = useProgram();
  const pathname = usePathname();

  const initName =
    state.initiative.name ? state.initiative.name
    : state.initiative.sharpenedProblem ? "Workshop in progress" : "Demo initiative ready";

  return (
    <div className="flex h-full flex-col bg-ink text-slate-300">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-400 shadow-glow">
          <Compass className="h-5 w-5 text-white" strokeWidth={2.4} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">AI Command Center</span>
          <span className="block text-[11px] text-slate-400">AI Program · by Sudeep Lalka</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          href="/story"
          onClick={onNavigate}
          className={cn(
            "mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/story" || pathname.startsWith("/story/")
              ? "bg-white/10 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white",
          )}
        >
          <BookOpen className="h-4 w-4 text-primary" />
          The story
          <span className="ml-auto text-[10px] font-normal text-slate-500">2-min read</span>
        </Link>

        <div className="px-2 pb-1 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">The Program</p>
          <p className="text-[10px] text-slate-500/80">An idea becomes governed value · gated</p>
        </div>

        {STAGES.map((s) => {
          const status = state.progress[s.key];
          const onRoute = s.href === "/" ? pathname === "/" : pathname.startsWith(s.href);
          const locked = status === "locked";
          const Icon = ICONS[s.key];
          return (
            <div key={s.key}>
              <div
                className={cn(
                  "group relative flex items-center rounded-lg transition-colors",
                  onRoute ? "bg-white/[0.12]" : "hover:bg-white/[0.06]",
                  locked && !onRoute && "opacity-60",
                )}
              >
                {onRoute && <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-1 rounded-r bg-sky-400" />}
                <Link
                  href={s.href}
                  onClick={onNavigate}
                  title={locked ? s.reason : undefined}
                  aria-current={onRoute ? "page" : undefined}
                  className={cn("flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm", onRoute ? "text-white" : "text-slate-300")}
                >
                  <Dot status={status} />
                  <span className="font-mono text-[10px] text-slate-500">{s.n}</span>
                  <Icon className={cn("h-4 w-4 shrink-0", onRoute ? "text-sky-400" : "text-slate-400")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate leading-tight">{s.label}</span>
                    <span className="block text-[10px] leading-tight text-slate-500">{s.sub}</span>
                  </span>
                  {status === "done" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  {locked && <Lock className="h-3 w-3 text-slate-500" />}
                </Link>
              </div>

            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="rounded-lg bg-white/[0.06] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Current initiative</p>
          <p className="mt-1 truncate text-sm font-semibold text-white" title={initName}>{initName}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{portfolio.length > 0 ? `${portfolio.length} initiative${portfolio.length > 1 ? "s" : ""} in portfolio` : "Start a strategy workshop to create your first AI initiative brief."}</p>
        </div>
      </div>
    </div>
  );
}
