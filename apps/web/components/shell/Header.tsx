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
// saying the same thing twice, the Header subtitle ("Prove the engine: retrieval +
// generation…") was a prose restatement of the acts below it, and "New here? How
// this lab works" duplicated the Guide link in the subnav's utility row.
//
// So they are now ONE band: identity on the left, the stage's nav on the right,
// using the horizontal space the header was already wasting. The subtitle survives
// only on the stage ROOT, where a visitor is arriving and hasn't met the lab yet;
// on the 13 subpages the acts say it better and the line is dropped.
//
// The band is NOT sticky and does NOT collapse. It scrolls away like any other
// content. A separate compact bar (identity · act › page · Next) is revealed once
// the band has gone, and it lives in a zero-height sticky wrapper so it can never
// move the page. See "the pinned bar" below.

const MODE_ROUTES = ["/data", "/build", "/deploy", "/govern", "/realize", "/story"];
const onAny = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(r + "/"));

// Shelled routes that are NOT stages. These used to fall through `?? STAGE_MAP.frame`,
// which made /architecture and /roadmap claim they were "Strategy & Planning", wrong
// <h1>, wrong subtitle, a bogus "Live" badge, and a "How this lab works" link pointing
// at /frame/guide. A missing stage is now simply a missing stage.
const NON_STAGE: Record<string, { title: string; subtitle: string }> = {
  "/architecture": { title: "Architecture", subtitle: "How the Command Center is built, and why it's built that way." },
  "/roadmap": { title: "Roadmap", subtitle: "What exists now, what comes next, and what's deliberately out of scope." },
  "/builds/eval-bench": { title: "Eval Bench", subtitle: "Model evaluation and threshold economics." },
  "/lifecycle": { title: "Lifecycle", subtitle: "The seven stages, and the contract between them." },
};

// The Header owns the page's single <h1>, so its title must be SPECIFIC, otherwise
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
  // Build and Govern render three acts, each with its own question. Those questions
  // ARE the subtitle, so the prose line is dropped there. It was also the single
  // biggest source of dead space: squeezed into the 172px rail, Deploy's subtitle
  // wrapped to six lines and made the band ~200px tall while the right-hand side held
  // one row of chips.
  const isPipeline = !!nav?.isPipeline;
  const subtitle = isPipeline
    ? ""
    : isHome
      ? "Your AI program at a glance, walk it end-to-end, or open any lab."
      : isStory
        ? "The whole program in seven beats, one idea taken from ambition to business case."
        : stage
          ? stage.will
          : (nonStage?.subtitle ?? "");

  /* Defined once, positioned differently by the two shapes below. */
  const menuButton = (
    <button
      ref={menuRef as React.RefObject<HTMLButtonElement>}
      onClick={onMenu}
      aria-haspopup="dialog"
      className="mt-0.5 shrink-0 rounded-lg border border-line p-2 text-slatey-300 hover:bg-slate-100 lg:hidden"
      aria-label="Open navigation"
    >
      <Menu className="h-5 w-5" />
    </button>
  );

  const titleBlock = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
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
  );

  const controls = showMode ? (
    <div className="flex flex-wrap items-center gap-1.5">
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === "demo" && <ArchetypeSelect value={demoArchetype} onChange={setDemoArchetype} />}
    </div>
  ) : null;

  return (
    <>
      {/* THE PINNED BAR. The wrapper is `h-0`, so it occupies ZERO height in flow and
          is physically incapable of moving the page. The bar inside slides down from
          above the viewport once the band has scrolled past, and slides back up when
          you return. Transform and opacity only: both are compositor properties, so
          this animates off the main thread and never triggers layout.
          (prefers-reduced-motion is honoured globally in globals.css.) */}
      {nav && (
        <div className="no-print sticky top-0 z-30 h-0 overflow-visible">
          <div
            className={cn(
              "border-b border-line bg-white/90 backdrop-blur-md",
              "transition-[transform,opacity] duration-200 ease-out will-change-transform motion-reduce:transition-none",
              pinned ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
            )}
            aria-hidden={!pinned}
          >
            <div className="mx-auto flex w-full max-w-[1440px] items-center px-5 py-2 md:px-8">
              <StageNavMini m={nav} title={title} />
            </div>
          </div>
        </div>
      )}

      {/* THE BAND. Not sticky: it scrolls away with the page, at exactly scroll speed.
          Nothing to animate, nothing to jerk.

          TWO SHAPES, because the stages are not the same shape (2026-07-13):

          · Pipeline (Build, Govern): a narrow identity rail beside three tall act
            columns. The rail's height is paid for by the columns next to it.

          · Everything else (Data, Deploy, Realize, Frame, Operate, and the non-stage
            routes): NO rail. Flat stages have one row of chips, so a 172px rail had
            nothing tall beside it to justify its height, and the wrapped subtitle left
            a huge void to its right. These get the full width: title and controls on
            one line, subtitle at a readable measure, chips beneath. */}
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-3 md:px-8">

          {isPipeline && nav ? (
            <div className="flex items-start gap-4">
              {menuButton}
              {/* The divider separates two different KINDS of thing (who you are vs
                  where you can go), which is a divider earning its ink. */}
              <div className="min-w-0 shrink-0 lg:w-[180px] lg:border-r lg:border-line lg:pr-5">
                {titleBlock}
                {controls && <div className="mt-2">{controls}</div>}
              </div>
              <StageNavFull m={nav} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {menuButton}
                {titleBlock}
                {controls && <div className="ml-auto">{controls}</div>}
              </div>
              {/* Full width, so it sets on one or two lines instead of a narrow ribbon. */}
              {subtitle && <p className="max-w-3xl text-sm leading-snug text-slatey-400">{subtitle}</p>}
              {nav && <StageNavFull m={nav} />}
            </div>
          )}

        </div>
      </header>

      {/* Sentinel. Sits at the foot of the band; when it crosses the top of the
          viewport the pinned bar reveals itself. A 1px element observed by
          IntersectionObserver, rather than a scroll handler doing per-frame math. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
    </>
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
      className="max-w-[180px] rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-slatey-300 focus:outline-none focus:ring-1 focus:ring-primary/40"
    >
      {DEMO_ARCHETYPES.map((a) => (
        <option key={a.id} value={a.id}>{a.label}</option>
      ))}
    </select>
  );
}
