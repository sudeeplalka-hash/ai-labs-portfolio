"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, FlaskConical, Lock, CircleDot } from "lucide-react";
import { useProgram, STAGES, DEMO_ARCHETYPES, type DemoArchetype } from "@labs/program-core";
import { STAGE_SECTIONS } from "@labs/kit";
import { cn } from "@labs/design-system";
import { useStageNav, StageNavFull, StageNavMini } from "./StageNav";

// THE BAND (2026-07-12). Header and the in-stage nav used to be two stacked cards:
// Header (~100px) + ProgramRail (~34px) + a subnav card inside <main> (~150px +
// 24px margin) ≈ 310px of chrome before a single pixel of content. They were also
// saying the same thing twice — the Header subtitle ("Prove the engine: retrieval +
// generation…") was a prose restatement of the acts below it, and "New here? How
// this lab works" duplicated the Guide link in the subnav's utility row.
//
// So they are now ONE sticky band: identity on the left, the stage's nav on the
// right, using the horizontal space the header was already wasting. The subtitle
// survives only on the stage ROOT, where a visitor is arriving and hasn't met the
// lab yet; on the 13 subpages the acts say it better and the line is dropped.
//
// It collapses on scroll to a single line (identity · act › page · mode · Next).
// See COLLAPSE/RESTORE below for why the two thresholds differ.

const MODE_ROUTES = ["/data", "/build", "/deploy", "/govern", "/realize", "/story"];
const onAny = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(r + "/"));

// Shelled routes that are NOT stages. These used to fall through `?? STAGE_MAP.frame`,
// which made /architecture and /roadmap claim they were "Strategy & Planning" — wrong
// <h1>, wrong subtitle, a bogus "Live" badge, and a "How this lab works" link pointing
// at /frame/guide. A missing stage is now simply a missing stage.
const NON_STAGE: Record<string, { title: string; subtitle: string }> = {
  "/architecture": { title: "Architecture", subtitle: "How the Command Center is built, and why it's built that way." },
  "/roadmap": { title: "Roadmap", subtitle: "What exists now, what comes next, and what's deliberately out of scope." },
  "/builds/eval-bench": { title: "Eval Bench", subtitle: "Model evaluation and threshold economics." },
  "/lifecycle": { title: "Lifecycle", subtitle: "The seven stages, and the contract between them." },
};

// The Header owns the page's single <h1>, so its title must be SPECIFIC — otherwise
// ~20 govern routes all announce themselves as "Govern". STAGE_SECTIONS is already the
// canonical route→label map, so reuse it rather than inventing a second one.
function sectionLabel(stageKey: string, pathname: string): string | undefined {
  const groups = STAGE_SECTIONS[stageKey as keyof typeof STAGE_SECTIONS];
  if (!groups) return undefined;
  for (const g of groups) {
    for (const item of g.items) {
      if (item.href.includes("#")) continue;
      if (pathname === item.href || pathname === item.href + "/") return item.label;
    }
  }
  return undefined;
}

export function Header({ onMenu, menuRef }: { onMenu?: () => void; menuRef?: React.RefObject<HTMLButtonElement | null> }) {
  const { mode, setMode, state, demoArchetype, setDemoArchetype } = useProgram();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isStory = pathname === "/story" || pathname.startsWith("/story/");

  // No `?? STAGE_MAP.frame`: a route that isn't a stage must not pretend to be one.
  const stage = STAGES.find((s) => pathname === s.href || pathname.startsWith(s.href + "/"));
  const path = pathname.replace(/\/$/, "") || "/";
  const nonStage = NON_STAGE[path];
  const section = stage && path !== stage.href ? sectionLabel(stage.key, path) : undefined;
  const atStageRoot = !!stage && path === stage.href;

  const nav = useStageNav(stage?.key);

  const isFrame = !isHome && !isStory && stage?.key === "frame";
  const status = stage ? state.progress[stage.key] : undefined;
  const showMode = onAny(pathname, MODE_ROUTES);

  const title = isHome
    ? "Command Center"
    : isStory
      ? "Storyline"
      : stage
        ? section && section !== stage.label
          ? `${stage.label} · ${section}`
          : stage.label
        : (nonStage?.title ?? "AI Program Command Center");
  // The subtitle is worth saying ONCE, on arrival. On subpages the acts restate it.
  const subtitle = isHome
    ? "Your AI program at a glance, walk it end-to-end, or open any lab."
    : isStory
      ? "The whole program in seven beats, one idea taken from ambition to business case."
      : stage
        ? (atStageRoot || !nav ? stage.will : "")
        : (nonStage?.subtitle ?? "");

  /* ------------------------------------------------------- scroll collapse */
  // Two thresholds on purpose. Collapsing shrinks the band, which pulls the content
  // below it upward. With ONE threshold the resulting layout shift can bounce you back
  // across it and the header flickers open/closed forever. The gap breaks that loop.
  // We deliberately do NOT compensate scrollTop: clamping at the top of the document
  // makes compensation unsolvable (you cannot scroll to a negative offset), so instead
  // the collapse is animated and the content slides rather than jumps.
  const COLLAPSE = 120;
  const RESTORE = 40;
  const [small, setSmall] = useState(false);
  const smallRef = useRef(false);

  useEffect(() => {
    if (!nav) return; // nothing to collapse
    const onScroll = () => {
      const y = window.scrollY;
      if (!smallRef.current && y > COLLAPSE) { smallRef.current = true; setSmall(true); }
      else if (smallRef.current && y < RESTORE) { smallRef.current = false; setSmall(false); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [nav]);

  // A new route starts at the top of its own content, so start expanded.
  useEffect(() => { smallRef.current = false; setSmall(false); }, [pathname]);

  const collapsed = small && !!nav;

  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-3 md:px-8">
        <div className="flex items-start gap-4">
          <button
            ref={menuRef as React.RefObject<HTMLButtonElement>}
            onClick={onMenu}
            aria-haspopup="dialog"
            className="mt-0.5 rounded-lg border border-line p-2 text-slatey-300 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Identity. On a stage with a nav this is the narrow left rail; the divider
              separates two different KINDS of thing (who you are vs where you can go),
              which is a divider earning its ink rather than decorating. */}
          <div
            className={cn(
              "min-w-0",
              nav && !collapsed && "shrink-0 lg:w-[172px] lg:border-r lg:border-line lg:pr-5",
              collapsed && "hidden",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-ink md:text-xl">{title}</h1>
              {!isHome && !isStory && stage && (isFrame ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <FlaskConical className="h-3 w-3" /> Live
                </span>
              ) : status === "locked" ? (
                <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20 sm:inline-flex">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              ) : (
                <span className="hidden items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-dark ring-1 ring-inset ring-primary/20 sm:inline-flex">
                  <CircleDot className="h-3 w-3" /> Active
                </span>
              ))}
            </div>

            {subtitle && <p className="mt-1 hidden text-sm text-slatey-400 sm:block">{subtitle}</p>}

            {showMode && (
              <div className={cn("mt-2 flex flex-wrap items-center gap-1.5", !nav && "hidden")}>
                <ModeToggle mode={mode} setMode={setMode} />
                {mode === "demo" && (
                  <ArchetypeSelect value={demoArchetype} onChange={setDemoArchetype} />
                )}
              </div>
            )}
          </div>

          {/* The stage's nav. Full at rest, one line once you're into the lab. */}
          {nav && (collapsed
            ? <StageNavMini m={nav} title={title} />
            : <StageNavFull m={nav} />
          )}

          {/* Routes with no stage nav keep the original right-aligned controls. */}
          {!nav && showMode && (
            <div className="ml-auto flex flex-col items-end gap-1.5">
              <ModeToggle mode={mode} setMode={setMode} />
              {mode === "demo" && <ArchetypeSelect value={demoArchetype} onChange={setDemoArchetype} />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function ModeToggle({ mode, setMode }: { mode: "live" | "demo"; setMode: (m: "live" | "demo") => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Lab mode">
      {(["live", "demo"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          title={m === "live" ? "Connected to your threaded initiative" : "Standalone sandbox with sample data"}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
            mode === m ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
          )}
        >
          {m === "live" ? "Live lab" : "Demo"}
        </button>
      ))}
    </div>
  );
}

function ArchetypeSelect({ value, onChange }: { value: DemoArchetype; onChange: (v: DemoArchetype) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DemoArchetype)}
      aria-label="Demo archetype"
      title={DEMO_ARCHETYPES.find((a) => a.id === value)?.blurb}
      className="max-w-[172px] rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-slatey-300 focus:outline-none focus:ring-1 focus:ring-primary/40"
    >
      {DEMO_ARCHETYPES.map((a) => (
        <option key={a.id} value={a.id}>{a.label}</option>
      ))}
    </select>
  );
}
