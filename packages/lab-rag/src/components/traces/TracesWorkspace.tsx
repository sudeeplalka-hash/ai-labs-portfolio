"use client";

import { useState } from "react";
import { Database, FlaskConical } from "lucide-react";
import { TraceExplorer } from "./TraceExplorer";
import { LiveTracesView } from "./LiveTracesView";
import { cn } from "@rag/lib/cn";

type Tab = "mock" | "live";

// Top-level switch between pre-computed mock traces and live lab traces.
export function TracesWorkspace() {
  const [tab, setTab] = useState<Tab>("mock");

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "mock", label: "Mock Evaluation Traces", icon: Database },
    { id: "live", label: "Live Lab Traces", icon: FlaskConical },
  ];

  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-lg border border-line bg-navy-900/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-primary/10 text-primary ring-1 ring-inset ring-accent/30" : "text-slatey-400 hover:text-ink",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mock" ? <TraceExplorer /> : <LiveTracesView />}
    </div>
  );
}
