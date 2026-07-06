"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, FlaskConical, Lock, CircleDot, BookOpen, ArrowRight } from "lucide-react";
import { useProgram, STAGES, STAGE_MAP, DEMO_ARCHETYPES, type DemoArchetype } from "@labs/program-core";
import { cn } from "@labs/design-system";

// The Live/Demo toggle is available on every mode-aware stage (and the
// Storyline). Strategy is excluded on purpose: it has its own "Use Sample
// Initiative" flow and ignores the mode, so a toggle there would do nothing.
const MODE_ROUTES = ["/data", "/build", "/deploy", "/govern", "/realize", "/story"];
const onAny = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(r + "/"));

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { mode, setMode, state, demoArchetype, setDemoArchetype } = useProgram();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isStory = pathname === "/story" || pathname.startsWith("/story/");
  const stage = STAGES.find((s) => pathname === s.href || pathname.startsWith(s.href + "/")) ?? STAGE_MAP.frame;
  const isFrame = !isHome && !isStory && stage.key === "frame";
  const status = state.progress[stage.key];
  const showMode = onAny(pathname, MODE_ROUTES);
  const title = isHome ? "Command Center" : isStory ? "Storyline" : stage.label;
  const subtitle = isHome
    ? "Your AI program at a glance, walk it end-to-end, or open any lab."
    : isStory
      ? "The whole program in six beats, one idea, idea to business case."
      : stage.will;
  // A quiet entry point to the lab's guide, caught at the moment of arrival.
  const showGuideLink = !isHome && !isStory && !pathname.includes("/guide");
  const guideHref = `${stage.href}/guide`;

  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="rounded-lg border border-line p-2 text-slatey-300 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-ink md:text-xl">{title}</h1>
              {!isHome && !isStory && (isFrame ? (
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
