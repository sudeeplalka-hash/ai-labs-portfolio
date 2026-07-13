"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, Database, Boxes, Rocket, ShieldCheck, TrendingUp, RefreshCcw, Lock, Check, ChevronDown, BookOpen, type LucideIcon,
} from "lucide-react";
import { useProgram, STAGES, type StageKey, type StageStatus } from "@labs/program-core";
import { STAGE_SECTIONS, type StageSectionItem } from "@labs/kit";
import { cn } from "@labs/design-system";

const ICONS: Record<StageKey, LucideIcon> = {
  frame: Compass, data: Database, build: Boxes, deploy: Rocket, govern: ShieldCheck, realize: TrendingUp, operate: RefreshCcw,
};

// Each lab's sub-pages, surfaced in the sidebar so they aren't hidden behind
// the in-page subnav. The config lives in @labs/kit (STAGE_SECTIONS) and is
// shared with the Header band's StageNav, so the two surfaces can never diverge
// (R2.2). Route-based labs link to real URLs; Deploy and Realize use a hash
// that their views read to switch the active in-page section.
type Sub = StageSectionItem;

// The dot is a non-text indicator, so WCAG 1.4.11 applies: 3:1 against bg-ink.
// bg-slate-600 (#475569) measured 2.08:1 — invisible to low-vision users, and it
// is the ONLY thing distinguishing a pending stage. slate-500 clears the bar.
// (Shape/label still carry the meaning too — see the Check and Lock icons below.)
function Dot({ status }: { status: StageStatus }) {
  return (
    <span className={cn(
      "h-2 w-2 shrink-0 rounded-full",
      status === "done" ? "bg-emerald-400" : status === "active" ? "bg-sky-400 ring-4 ring-sky-400/20" : "bg-slate-500",
    )} />
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, portfolio } = useProgram();
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [openGroup, setOpenGroup] = useState<Record<string, boolean>>({});
  const [hash, setHash] = useState("");

  // Track the URL hash so Deploy/Realize section sub-items can highlight.
  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash.replace("#", "") : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  const initName =
    state.initiative.name ? state.initiative.name
    : state.initiative.sharpenedProblem ? "Workshop in progress" : "Demo initiative ready";

  // Normalize trailing slashes (the app uses trailingSlash routing) so exact
  // matches on lab roots like /govern still work.
  const norm = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);
  const path = norm(pathname);
  const childActive = (stageHref: string, sub: Sub, index: number) => {
    if (sub.href.includes("#")) {
      const [p, key] = sub.href.split("#");
      if (!path.startsWith(norm(p))) return false;
      return hash ? hash === key : index === 0; // first section is active when no hash
    }
    const href = norm(sub.href);
    if (sub.href === stageHref) return path === href;
    return path === href || path.startsWith(href + "/");
  };

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
          <span className="ml-auto text-[10px] font-normal text-inkmuted">2-min read</span>
        </Link>

        <div className="px-2 pb-1 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-inkmuted">The Program</p>
          <p className="text-[10px] text-inkmuted/80">An idea becomes governed value · gated</p>
        </div>

        {STAGES.map((s) => {
          const status = state.progress[s.key];
          const onRoute = s.href === "/" ? pathname === "/" : pathname.startsWith(s.href);
          const locked = status === "locked";
          const Icon = ICONS[s.key];
          const children = STAGE_SECTIONS[s.key];
          const expanded = open[s.key] ?? onRoute; // auto-open the lab you're in
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
                  <span className="font-mono text-[10px] text-inkmuted">{s.n}</span>
                  <Icon className={cn("h-4 w-4 shrink-0", onRoute ? "text-sky-400" : "text-slate-400")} />
                  <span className="min-w-0 flex-1">
                    {/* No `truncate`: the rail is 288px and the label span is squeezed by
                        dot + number + icon + check + chevron, so "Strategy & Planning" and
                        "Operate · Day Two" clipped even at w-72. The row is already two
                        lines tall, so wrapping costs nothing and stops the primary nav
                        from lying about where it goes. */}
                    <span className="block leading-tight">{s.label}</span>
                    <span className="block text-[10px] leading-tight text-inkmuted">{s.sub}</span>
                  </span>
                  {status === "done" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  {locked && <Lock className="h-3 w-3 text-inkmuted" />}
                </Link>
                {children && (
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [s.key]: !expanded }))}
                    aria-label={expanded ? `Collapse ${s.label}` : `Expand ${s.label}`}
                    aria-expanded={expanded}
                    className="shrink-0 px-2 py-2 text-inkmuted hover:text-white"
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                  </button>
                )}
              </div>

              {children && expanded && (
                <div className="mb-1 mt-0.5 ml-[1.35rem] space-y-1.5 border-l border-white/10 pl-3 pr-1">
                  {children.map((g, gi) => {
                    const labeled = !!g.label;
                    const gkey = `${s.key}:${g.label ?? gi}`;
                    const groupHasActive = g.items.some((c, i) => childActive(s.href, c, i));
                    const gOpen = !labeled || (openGroup[gkey] ?? groupHasActive); // auto-open the group you're in
                    return (
                    <div key={gi} className="space-y-0.5">
                      {labeled && (
                        <button
                          onClick={() => setOpenGroup((o) => ({ ...o, [gkey]: !gOpen }))}
                          aria-expanded={gOpen}
                          className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 pb-0.5 pt-1 text-[9.5px] font-semibold uppercase tracking-wider text-inkmuted transition-colors hover:text-slate-300"
                        >
                          <span>{g.label}</span>
                          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", gOpen && "rotate-180")} />
                        </button>
                      )}
                      {gOpen && (
                      <ul className={cn("space-y-0.5", labeled && "ml-1.5 border-l border-white/10 pl-2")}>
                        {g.items.map((c, i) => {
                          const act = childActive(s.href, c, i);
                          const cls = cn(
                            "block truncate rounded-md px-2.5 py-1 text-[12.5px] transition-colors",
                            act ? "bg-sky-400/15 font-medium text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200",
                          );
                          // Hash links (Deploy/Realize in-page sections) use a plain anchor so the
                          // browser fires a native hashchange the view listens for. Route links use
                          // Next's Link for client side navigation.
                          const isHash = c.href.includes("#");
                          return (
                            <li key={c.href}>
                              {isHash ? (
                                <a href={c.href} onClick={() => onNavigate?.()} aria-current={act ? "page" : undefined} className={cls}>
                                  {c.label}
                                </a>
                              ) : (
                                <Link href={c.href} onClick={onNavigate} aria-current={act ? "page" : undefined} className={cls}>
                                  {c.label}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
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
