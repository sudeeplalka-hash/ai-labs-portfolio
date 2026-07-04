"use client";

import { useProgram } from "@labs/program-core";
import { StagePlaceholder } from "./StagePlaceholder";

// Gates the Govern stage: locked until Framing is complete, then the real
// governance control plane renders.
export function GovernGate({ children }: { children: React.ReactNode }) {
  const { state, hydrated } = useProgram();
  if (!hydrated) return null;
  if (state.progress.govern === "locked") return <StagePlaceholder stageKey="govern" />;
  return <>{children}</>;
}
