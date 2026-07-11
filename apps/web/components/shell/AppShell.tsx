"use client";

import { useState } from "react";
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
  // Layer 0 landing and the new collections render without C1's shell.
  if (isBareRoute(pathname)) return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      {/* w-72 (R2.4): the rail was w-64 and truncated "Strategy & Planning" /
          "Build · RAG"; the extra 32px fits every stage label at rest. */}
      <aside className="no-print hidden w-72 shrink-0 bg-ink lg:block">
        <div className="sticky top-0 h-screen"><Sidebar /></div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-ink">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <Header onMenu={() => setMobileOpen(true)} />
        <ProgramRail />
        {/* overflow-x-clip: guard against sub-viewport-width leaks on mobile
            without creating a scroll container (keeps lg:sticky panels working). */}
        {/* R2.1: the per-stage story band moved INTO each stage header (see
            StageThread), one header per page instead of a stacked triple. */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-x-clip px-5 py-6 md:px-8 md:py-8">
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
