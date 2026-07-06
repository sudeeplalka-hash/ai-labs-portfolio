"use client";

import { useEffect, useRef } from "react";
import { useProgram } from "@labs/program-core";
import { getSessions } from "@data/lib/live/session";

// Writes the real Data lab result into ProgramState.data so Realize/Deploy can
// read it. Reuses the Data lab's own session store, no duplicated logic.
export function DataSliceWriter() {
  const { update, hydrated } = useProgram();
  const last = useRef<string>("");

  useEffect(() => {
    if (!hydrated) return;
    const sync = () => {
      const ss = getSessions();
      if (!ss.length) return;
      const readiness = Math.round(ss.reduce((a, s) => a + (s.score ?? 0), 0) / ss.length);
      // SessionGate values are capitalized ("Approved" | "Conditional" | "Hold" | "Rejected").
      const gaps = ss.filter((s) => s.gate !== "Approved" && s.gate !== "Conditional").length;
      const status = readiness >= 70 ? "healthy" : readiness >= 40 ? "watch" : "at-risk";
      const sig = JSON.stringify({ readiness, gaps });
      if (sig === last.current) return;
      last.current = sig;
      // Merge, never replace, so derived fields on the data slice (e.g. the
      // Data Readiness Handoff written by DataHandoffCard) survive this sync.
      update((d) => { d.data = { ...(d.data ?? {}), readinessScore: readiness, gaps, status }; });
    };
    sync();
    const id = setInterval(sync, 3000);
    return () => clearInterval(id);
  }, [hydrated, update]);

  return null;
}
