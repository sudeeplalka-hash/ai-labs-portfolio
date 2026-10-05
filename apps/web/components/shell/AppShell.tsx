"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProgramRail } from "@/components/lifecycle/ProgramRail";
import { IS_COMMAND_CENTER } from "@/lib/site";
import { Modal } from "@labs/design-system";

// Parent-frame + new-collection routes render chrome-free (no Collection-1 lifecycle
// sidebar): the new collections and the changelog. Collection 1's own routes keep the
// AppShell. The landing "/" depends on the deploy: on the portfolio site it's the
// full-bleed Competency Map (bare); on the command-center site it's the lifecycle Home,
// which keeps the shell so the sidebar/header/program-rail frame it.
const BARE_PREFIXES = ["/agents", "/business", "/engagement", "/builds", "/changelog", "/industries", "/storylines"];
function isBareRoute(pathname: string): boolean {
  if (pathname === "/") return !IS_COMMAND_CENTER;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeDrawer = () => setMobileOpen(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (!desktop.matches || !mobileOpen) return;
      setMobileOpen(false);
      // The phone trigger is hidden at this breakpoint. Restore visible context
      // after the native dialog has released its inert background.
      requestAnimationFrame(() => {
        const current = document.querySelector<HTMLElement>('aside.no-print a[aria-current="page"]')
          ?? document.querySelector<HTMLElement>('aside.no-print a[href]');
        current?.focus({ preventScroll: true });
      });
    };
    sync();
    desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, [mobileOpen]);
  useEffect(() => setMobileOpen(false), [pathname]);

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

      <Modal open={mobileOpen} onClose={closeDrawer} title="Program navigation" className="p-0" panelClassName="absolute left-0 top-0 h-[100dvh] w-80 max-w-[calc(100vw-2rem)] bg-ink">
            <button onClick={closeDrawer} className="absolute right-3 top-4 rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Modal>

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <Header onMenu={() => setMobileOpen(true)} menuRef={triggerRef} menuOpen={mobileOpen} />
        <ProgramRail />
        {/* Wide data belongs in labelled internal scroll regions; do not clip
            the whole main area to conceal an overflowing child. */}
        {/* R2.1: the per-stage story band moved INTO each stage header (see
            StageThread), one header per page instead of a stacked triple. */}
        {/* tabIndex={-1} so the skip link can actually move focus here, not just scroll. */}
        <main id="main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 px-4 py-6 focus:outline-none md:px-8 md:py-8">
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
