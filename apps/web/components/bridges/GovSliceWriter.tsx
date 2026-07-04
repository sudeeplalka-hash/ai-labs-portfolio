"use client";

import { useEffect, useRef } from "react";
import { useProgram } from "@labs/program-core";
import { scoreUseCase } from "@gov/lib/api";

// Scores the *framed initiative* with governance's own risk engine and writes the
// real risk tier into ProgramState.governance — so Realize's risk discount traces
// to a governance decision about this exact bet (not a guess).
const TIER_CASE: Record<string, string> = { CRITICAL: "Critical", HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

export function GovSliceWriter() {
  const { state, update, hydrated } = useProgram();
  const last = useRef<string>("");
  const p = state.initiative.params;

  useEffect(() => {
    if (!hydrated || !p) return;
    const customerFacing = p.user === "Customers" || p.user === "Partners";
    const agentic = p.job === "Decide" || p.job === "Orchestrate" || p.job === "Monitor";
    const attrs: Record<string, string> = {
      data_sensitivity: customerFacing ? "confidential" : "internal",
      deployment_context: customerFacing ? "customer-facing" : "internal",
      use_case_type: agentic ? "agentic" : p.job === "Answer" ? "rag" : "assistant",
      business_function: p.user === "Customers" ? "Customer Service" : "Operations",
      human_oversight: p.risk === "Conservative" ? "required" : p.risk === "Aggressive" ? "none" : "optional",
    };
    const r = scoreUseCase(attrs);
    const tier = TIER_CASE[r.tier] ?? "Medium";
    const sig = `${tier}-${r.controls.length}`;
    if (sig === last.current) return;
    last.current = sig;
    update((d) => { d.governance = { riskTier: tier, controls: r.controls.length, status: "active" }; });
  }, [hydrated, p, update]);

  return null;
}
