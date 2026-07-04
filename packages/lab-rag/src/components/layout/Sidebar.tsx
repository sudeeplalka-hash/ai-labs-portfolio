"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitCompareArrows,
  Search,
  Database,
  AlertTriangle,
  Layers,
  MessageSquareText,
  Gauge,
  ShieldCheck,
  CircleCheckBig,
  Activity,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@rag/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

// The demo dashboards (mock evaluation data) — grouped under one section so the
// hierarchy is obvious: the Lab is the live product, these tell the story.
const DASHBOARD_NAV: NavItem[] = [
  { href: "/overview", label: "Executive Overview", icon: LayoutDashboard },
  { href: "/evaluations", label: "Evaluation Runs", icon: GitCompareArrows },
  { href: "/traces", label: "Query Trace Explorer", icon: Search },
  { href: "/dataset", label: "Golden Dataset", icon: Database },
  { href: "/failures", label: "Failure Analysis", icon: AlertTriangle },
  { href: "/retrieval", label: "Retrieval Quality", icon: Layers },
  { href: "/answers", label: "Answer Quality", icon: MessageSquareText },
  { href: "/operations", label: "Cost & Latency", icon: Gauge },
  { href: "/governance", label: "Governance", icon: ShieldCheck },
  { href: "/quality-gates", label: "Quality Gates", icon: CircleCheckBig },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const labActive = pathname === "/" || pathname.startsWith("/live-rag-lab");

  return (
    <div className="flex h-full flex-col bg-ink text-slate-300">
      <Link href="/build" onClick={onNavigate} className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-400 shadow-glow">
          <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">RAG Evaluator</span>
          <span className="block text-[11px] text-slate-400">Quality Control Tower</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* PRIMARY: the live product */}
        <Link
          href="/build"
          onClick={onNavigate}
          className={cn(
            "group relative flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
            labActive ? "bg-white/[0.14] ring-1 ring-inset ring-sky-400/50" : "bg-white/[0.06] ring-1 ring-inset ring-sky-400/25 hover:bg-white/10",
          )}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/20 text-sky-300">
            <FlaskConical className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">Live RAG Evaluator Lab</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_1px_rgba(16,185,129,0.9)]" />
                </span>
                Try
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-400">Interactive · live · your document</span>
          </span>
        </Link>

        {/* GROUP: the demo control tower */}
        <div className="px-2 pb-1 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Evaluation Control Tower</p>
          <p className="text-[10px] text-slate-500/80">Demo · mock evaluation data</p>
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
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="rounded-lg bg-white/[0.06] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Current Maturity</p>
          <p className="mt-1 text-sm font-semibold text-white">Level 3 · Controlled Pilot</p>
          <p className="mt-1 text-[11px] text-slate-400">Release: Hold</p>
        </div>
      </div>
    </div>
  );
}
