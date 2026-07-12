"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, FlaskConical, Lock, CircleDot, BookOpen, ArrowRight } from "lucide-react";
import { useProgram, STAGES, DEMO_ARCHETYPES, type DemoArchetype } from "@labs/program-core";
import { STAGE_SECTIONS } from "@labs/kit";
import { cn } from "@labs/design-system";

// The Live/Demo toggle is available on every mode-aware stage (and the
// Storyline). Strategy is excluded on purpose: it has its own "Use Sample
// Initiative" flow and ignores the mode, so a toggle there would do nothing.
const MODE_ROUTES = ["/data", "/build", "/deploy", "/govern", "/realize", "/story"];
const onAny = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(r + "/"));

// Shelled routes that are NOT stages. These used to fall through `?? STAGE_MAP.frame`,
// which made /architecture and /roadmap claim they were "Strategy & Planning" — wrong
// <h1>, wrong subtitle, a bogus "Live" badge, and a "How this lab works" link pointing
// at /frame/guide. A missing stage is now simply a missing stage. (a11y 2026-07-12)
const NON_STAGE: Record<string, { title: string; subtitle: string }> = {
  "/architecture": { title: "Architecture", subtitle: "How the Command Center is built, and why it's built that way." },
  "/roadmap": { title: "Roadmap", subtitle: "What exists now, what comes next, and what's deliberately out of scope." },
  "/builds/eval-bench": { title: "Eval Bench", subtitle: "Model evaluation and threshold economics." },
  "/lifecycle": { title: "Lifecycle", subtitle: "The seven stages, and the contract between them." },
};

// The page's own <h1> is the specific one ("Am I ready for the AI rulebook?"), but the
// Header is the only heading present on stage roots and on subpages that don't set one.
// So the Header owns the single <h1> everywhere and pages render <h2> — which means the
// Header's title has to be SPECIFIC, or ~20 govern routes all announce themselves as
// "Govern". STAGE_SECTIONS is already the canonical route→label map, so reuse it.
function sectionLabel(stageKey: string, pathname: string): string | undefined {
  const groups = STAGE_SECTIONS[stageKey as keyof typeof STAGE_SECTIONS];
  if (!groups) return undefined;
  for (const g of groups) {
    for (const item of g.items) {
      if (item.href.includes("#")) continue; // in-page sections, not routes
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
  const path = pathname.replace(/\/$/, "") || "/"; // trailingSlash routing
  const nonStage = NON_STAGE[path];
  // Only look up a section on SUBpages. On a stage root the title is just the stage
  // ("Data"), not "Data · Live Data Lab".
  const section = stage && path !== stage.href ? sectionLabel(stage.key, path) : undefined;

  const isFrame = !isHome && !isStory && stage?.key === "frame";
  const status = stage ? state.progress[stage.key] : undefined;
  const showMode = onAny(pathname, MODE_ROUTES);

  // Specific enough to identify the page on its own — this is the document's only <h1>.
  const title = isHome
    ? "Command Center"
    : isStory
      ? "Storyline"
      : stage
        ? section && section !== stage.label
          ? `${stage.label} · ${section}`
          : stage.label
        : (nonStage?.title ?? "AI Program Command Center");
  const subtitle = isHome
    ? "Your AI program at a glance, walk it end-to-end, or open any lab."
    : isStory
      ? "The whole program in seven beats, one idea taken from ambition to business case."
      : stage
        ? stage.will
        : (nonStage?.subtitle ?? "");
  // A quiet entry point to the lab's guide, caught at the moment of arrival.
  // Only a real stage has a guide — /architecture and /roadmap do not.
  const showGuideLink = !!stage && !isHome && !isStory && !pathname.includes("/guide");
  const guideHref = `${stage?.href ?? ""}/guide`;

  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          {/* ref so the drawer can hand focus back here when it closes */}
          <button ref={menuRef as React.RefObject<HTMLButtonElement>} onClick={onMenu} aria-haspopup="dialog" className="rounded-lg border border-line p-2 text-slatey-300 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {/* The single <h1> for every shelled route. Page content renders <h2>. */}
              <h1 className="text-lg font-semibold text-ink md:text-xl">{title}</h1>
              {/* `stage &&`: /architecture and /roadmap are not labs, so no status badge. */}
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
            <p className="hidden text-sm text-slatey-400 sm:block">{subtitle}</p>
            {showGuideLink && (
              <Link href={guideHref} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark">
                <BookOpen className="h-3.5 w-3.5" /> New here? How this lab works
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>

        {showMode && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="inline-flex rounded-lg border border-line bg-white p-1" role="group" aria-label="Lab mode">
              {(["live", "demo"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  title={m === "live" ? "Connected to your threaded initiative" : "Standalone sandbox with sample data"}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    mode === m ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
                  )}
                >
                  {m === "live" ? "Live lab" : "Demo"}
                </button>
              ))}
            </div>
            {/* Demo archetype switcher, shuffle through the six curated samples. */}
            {mode === "demo" && (
              <select
                value={demoArchetype}
                onChange={(e) => setDemoArchetype(e.target.value as DemoArchetype)}
                aria-label="Demo archetype"
                title={DEMO_ARCHETYPES.find((a) => a.id === demoArchetype)?.blurb}
                className="max-w-[180px] rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-slatey-300 focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {DEMO_ARCHETYPES.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
