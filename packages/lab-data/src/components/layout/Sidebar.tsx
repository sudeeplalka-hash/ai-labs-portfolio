"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  GitBranch,
  BookOpen,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@data/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

const DASHBOARD_NAV: NavItem[] = [
  { href: "/overview", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/pipeline", label: "Technical Pipeline", icon: GitBranch },
];

const REFERENCE_NAV: NavItem[] = [{ href: "/guide", label: "Prep & Guidelines Guide", icon: BookOpen }];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const labActive = pathname === "/" || pathname.startsWith("/live-data-lab");

  return (
    <div className="flex h-full flex-col bg-ink text-slate-300">
      <Link href="/data" onClick={onNavigate} className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-400 shadow-glow">
          <Boxes className="h-5 w-5 text-white" strokeWidth={2.2} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">Data Lab</span>
          <span className="block text-[11px] text-slate-400">Data Readiness Control Tower</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* PRIMARY: the live product */}
        <Link
          href="/data"
          onClick={onNavigate}
          className={cn(
            "group relative flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
            labActive
              ? "bg-white/[0.14] ring-1 ring-inset ring-sky-400/50"
              : "bg-white/[0.06] ring-1 ring-inset ring-sky-400/25 hover:bg-white/10",
          )}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/20 text-sky-300">
            <FlaskConical className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">Live Data Lab</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_1px_rgba(16,185,129,0.9)]" />
                </span>
                Try
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-400">Upload a file · get a readiness report</span>
          </span>
        </Link>

        {/* GROUP: build (live tools) */}
        <div className="px-2 pb-1 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Build</p>
          <p className="text-[10px] text-slate-500/80">Live · multi file</p>
        </div>
        {(() => {
          const active = pathname.startsWith("/corpus");
          return (
            <Link
              href="/data/corpus"
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/12 font-medium text-white" : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              {active && <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-1 rounded-r bg-sky-400" />}
              <Boxes className={cn("h-4 w-4 shrink-0", active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200")} />
              <span className="truncate">Corpus Builder</span>
            </Link>
          );
        })()}

        {/* GROUP: dashboards */}
        <div className="px-2 pb-1 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Control Tower</p>
          <p className="text-[10px] text-slate-500/80">Demo · mock data</p>
        </div>
        {DASHBOARD_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/12 font-medium text-white" : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              {active && <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-1 rounded-r bg-sky-400" />}
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        {/* GROUP: reference */}
        <div className="px-2 pb-1 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reference</p>
          <p className="text-[10px] text-slate-500/80">How prep works</p>
        </div>
        {REFERENCE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/12 font-medium text-white" : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              {active && <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-1 rounded-r bg-sky-400" />}
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="rounded-lg bg-white/[0.06] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Pipeline status</p>
          <p className="mt-1 text-sm font-semibold text-white">71% ingestion ready</p>
          <p className="mt-1 text-[11px] text-slate-400">Hands off to: RAG Evaluator</p>
        </div>
      </div>
    </div>
  );
}
