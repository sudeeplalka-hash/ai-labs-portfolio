"use client";

import { useEffect, useState } from "react";
import { loadStoredTraces } from "@rag/lib/live-lab/liveMetrics";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

// Client-only hook that loads the user's saved lab traces from localStorage.
export function useLiveTraces() {
  const [mounted, setMounted] = useState(false);
  const [traces, setTraces] = useState<LiveRagLabTrace[]>([]);
  useEffect(() => {
    setTraces(loadStoredTraces());
    setMounted(true);
  }, []);
  return { mounted, traces };
}
