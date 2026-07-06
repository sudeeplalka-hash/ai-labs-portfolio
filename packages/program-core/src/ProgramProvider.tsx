"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProgramState, PortfolioEntry, Mode } from "./types";
import {
  blankState, demoState, loadState, saveState, loadPortfolio, savePortfolio, MODE_KEY,
  DEMO_ARCHETYPE_KEY, DEMO_ARCHETYPES, type DemoArchetype,
} from "./store";

interface Ctx {
  state: ProgramState;
  portfolio: PortfolioEntry[];
  hydrated: boolean;
  mode: Mode;
  setMode: (m: Mode) => void;
  /** Which curated sample the Demo sandbox (and the sample loader) uses. */
  demoArchetype: DemoArchetype;
  setDemoArchetype: (a: DemoArchetype) => void;
  update: (mut: (draft: ProgramState) => void) => void;
  addToPortfolio: (entry: PortfolioEntry) => void;
  reset: () => void;
}

const ProgramCtx = createContext<Ctx | null>(null);

const isArchetype = (v: string | null): v is DemoArchetype => DEMO_ARCHETYPES.some((a) => a.id === v);

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgramState>(blankState);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [mode, setModeState] = useState<Mode>("live");
  const [demoArchetype, setDemoArchetypeState] = useState<DemoArchetype>("knowledge-assistant");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setPortfolio(loadPortfolio());
    const m = (typeof window !== "undefined" && window.localStorage.getItem(MODE_KEY)) as Mode | null;
    if (m === "live" || m === "demo") setModeState(m);
    const a = typeof window !== "undefined" ? window.localStorage.getItem(DEMO_ARCHETYPE_KEY) : null;
    if (isArchetype(a)) setDemoArchetypeState(a);
    setHydrated(true);
  }, []);

  const update = useCallback((mut: (draft: ProgramState) => void) => {
    setState((prev) => {
      const next: ProgramState = JSON.parse(JSON.stringify(prev));
      mut(next);
      saveState(next);
      return next;
    });
  }, []);

  const addToPortfolio = useCallback((entry: PortfolioEntry) => {
    setPortfolio((prev) => {
      const next = [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, 12);
      savePortfolio(next);
      return next;
    });
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, m);
  }, []);

  const setDemoArchetype = useCallback((a: DemoArchetype) => {
    setDemoArchetypeState(a);
    if (typeof window !== "undefined") window.localStorage.setItem(DEMO_ARCHETYPE_KEY, a);
  }, []);

  const reset = useCallback(() => {
    const fresh = blankState();
    saveState(fresh);
    setState(fresh);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, portfolio, hydrated, mode, setMode, demoArchetype, setDemoArchetype, update, addToPortfolio, reset }),
    [state, portfolio, hydrated, mode, setMode, demoArchetype, setDemoArchetype, update, addToPortfolio, reset],
  );

  return <ProgramCtx.Provider value={value}>{children}</ProgramCtx.Provider>;
}

export function useProgram() {
  const ctx = useContext(ProgramCtx);
  if (!ctx) throw new Error("useProgram must be used within ProgramProvider");
  return ctx;
}

/** The canonical mode-aware read. `src` is the curated demo archetype in Demo
 * mode and the live threaded program otherwise, every display derivation
 * should come from it, so no component can forget the archetype again.
 * Writers keep using `state`/`update` and must stay live-gated via `isDemo`. */
export function useProgramSource() {
  const { state, mode, demoArchetype, hydrated, update } = useProgram();
  const isDemo = mode === "demo";
  const src = useMemo(
    () => (isDemo ? demoState(demoArchetype) : state),
    [isDemo, demoArchetype, state],
  );
  return { src, isDemo, state, update, hydrated };
}
