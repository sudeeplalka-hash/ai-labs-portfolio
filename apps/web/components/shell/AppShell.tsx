"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { STAGES } from "@labs/program-core";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { StoryThread } from "@/components/story/StoryThread";
import { ProgramRail } from "@/components/lifecycle/ProgramRail";

// Parent-frame + new-collection routes render chrome-free (no Collection-1 lifecycle
// sidebar): the Competency Map (/) is the parent landing, the new collections, and
// the changelog. Collection 1's own routes keep the AppShell.
const BARE_PREFIXES = ["/agents", "/business", "/engagement", "/changelog"];
function isBareRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  // Which stage are we in? (Home and the Storyline aren't a single lab.)
  const stage = STAGES.find((s) => pathname === s.href || pathname.startsWith(s.href + "/"))?.key;
  // Layer 0 landing and the new collections render without C1's shell.
  if (isBareRoute(pathname)) return <>{children}</>;
  return (
    <div className="flex min-h-screen">
      <aside className="no-print hidden w-64 shrink-0 bg-ink lg:block">
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
        <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-x-clip px-5 py-6 md:px-8 md:py-8">
          {stage && <StoryThread stage={stage} />}
          {children}
        </main>
        <footer className="no-print border-t border-line px-5 py-4 text-center text-xs text-slatey-500 md:px-8">
          AI Program Command Center · one initiative, end to end · client-side demo
        </footer>
      </div>
    </div>
  );
}
