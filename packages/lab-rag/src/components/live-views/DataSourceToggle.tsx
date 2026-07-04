"use client";

import { useState, type ReactNode } from "react";
import { Database, FlaskConical } from "lucide-react";
import { cn } from "@rag/lib/cn";

// Demo (mock data) ↔ Live (your lab sessions) switch, shared across dashboard
// pages where a live equivalent genuinely exists.
export function DataSourceToggle({ demo, live }: { demo: ReactNode; live: ReactNode }) {
  const [tab, setTab] = useState<"demo" | "live">("demo");
  const tabs: { id: "demo" | "live"; label: string; icon: typeof Database }[] = [
    { id: "demo", label: "Demo data", icon: Database },
    { id: "live", label: "Your live sessions", icon: FlaskConical },
  ];
  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-lg border border-line bg-white p-1 shadow-card">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      {tab === "demo" ? demo : live}
    </div>
  );
}
