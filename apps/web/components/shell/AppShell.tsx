"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProgramRail } from "@/components/lifecycle/ProgramRail";
import { IS_COMMAND_CENTER } from "@/lib/site";

// Parent-frame + new-collection routes render chrome-free (no Collection-1 lifecycle
// sidebar): the new collections and the changelog. Collection 1's own routes keep the
// AppShell. The landing "/" depends on the deploy: on the portfolio site it's the
// full-bleed Competency Map (bare); on the command-center site it's the lifecycle Home,
// which keeps the shell so the sidebar/header/program-rail frame it.
const BARE_PREFIXES = ["/agents", "/business", "/engagement", "/changelog", "/industries", "/storylines"];
function isBareRoute(pathname: string): boolean {
  if (pathname === "/") return !IS_COMMAND_CENTER;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // The mobile drawer is the ONLY way to navigate below lg, so it has to behave
  // like a real dialog: trap focus, close on Escape, lock the page behind it, and
  // hand focus back to the ☰ trigger on close. Previously it did none of these —
  // Tab walked straight out the back of it into the page underneath.
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeDrawer = useCallback(() => {
    setMobileOpen(false);
    triggerRef.current?.focus(); // restore focus to where it came from
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const panel = drawerRef.current;
    if (!panel) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // scroll lock

    const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus(); // move focus INTO the drawer on open

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Wrap at both ends so focus can never escape the panel.
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen, closeDrawer]);

  // Layer 0 landing and the new collections render without C1's shell.
  if (isBareRoute(pathname)) return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      {/* WCAG 2.4.1 Bypass Blocks (Level A). The rail puts 16 focusable controls
          ahead of <main>, re-traversed on every navigation across 84 routes.
          Visually hidden until focused, then it's the first Tab stop. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-glow"
      >
        Skip to content
      </a>

      {/* w-72 (R2.4): the rail was w-64 and truncated "Strategy & Planning" /
          "Build · RAG". The extra 32px was NOT enough — "Strategy & Planning" and
          "Operate · Day Two" still clipped at rest (verified in the live DOM,
          2026-07-12). Fixed properly in Sidebar.tsx by letting the label wrap
          rather than by chasing width. */}
      <aside className="no-print hidden w-72 shrink-0 bg-ink lg:block">
        <div className="sticky top-0 h-screen"><Sidebar /></div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Program navigation"
            className="absolute left-0 top-0 h-full w-72 bg-ink"
          >
            <button onClick={closeDrawer} className="absolute right-3 top-4 rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <Header onMenu={() => setMobileOpen(true)} menuRef={triggerRef} />
        <ProgramRail />
        {/* overflow-x-clip: guard against sub-viewport-width leaks on mobile
            without creating a scroll container (keeps lg:sticky panels working). */}
        {/* R2.1: the per-stage story band moved INTO each stage header (see
            StageThread), one header per page instead of a stacked triple. */}
        {/* tabIndex={-1} so the skip link can actually move focus here, not just scroll. */}
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 overflow-x-clip px-5 py-6 focus:outline-none md:px-8 md:py-8">
          {children}
        </main>
        <footer className="no-print border-t border-line px-5 py-4 text-center text-xs text-slatey-500 md:px-8">
          AI Program Command Center · one initiative, end to end · client side demo · build{" "}
          <span className="font-mono">{process.env.NEXT_PUBLIC_BUILD_SHA ?? "local"}</span>
        </footer>
      </div>
    </div>
  );
}
