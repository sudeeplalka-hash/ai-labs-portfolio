import type { Initiative, HandoffPayload } from "./types";
import { STATE_KEY } from "./store";

// ---- outbound (framing emits) ----
export function toPayload(i: Initiative): HandoffPayload {
  return {
    name: i.name,
    sharpenedProblem: i.sharpenedProblem,
    scores: i.scores,
    scope: i.scope,
    posture: i.params?.posture ?? null,
    risk: i.params?.risk ?? null,
    valueHypothesis: i.valueHypothesis,
    createdAt: i.createdAt,
  };
}

export function encodeInitiative(i: Initiative): string {
  if (typeof window === "undefined") return "";
  return window.btoa(encodeURIComponent(JSON.stringify(toPayload(i))));
}

export function handoffQuery(i: Initiative): string {
  return `?initiative=${encodeInitiative(i)}`;
}

// ---- inbound (downstream labs read) ----
type Raw = Partial<HandoffPayload> & {
  scores?: Partial<HandoffPayload["scores"]>;
  params?: { posture?: string | null; risk?: string | null };
};

function fromUrl(): Raw | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("initiative");
  if (!p) return null;
  try { return JSON.parse(decodeURIComponent(window.atob(p))) as Raw; } catch { return null; }
}

function fromStorage(): Raw | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { initiative?: Raw };
    return parsed?.initiative ?? null;
  } catch {
    return null;
  }
}

/** The framed bet as seen by a downstream lab, or null if nothing's been locked. */
export function readHandoff(): HandoffPayload | null {
  const src = fromUrl() ?? fromStorage();
  if (!src || !src.name) return null;
  const s: Partial<HandoffPayload["scores"]> = src.scores ?? {};
  return {
    name: src.name,
    sharpenedProblem: src.sharpenedProblem ?? null,
    scores: {
      value: Number(s.value ?? 0),
      feasibility: Number(s.feasibility ?? 0),
      dataReadiness: Number(s.dataReadiness ?? 0),
    },
    scope: typeof src.scope === "number" ? src.scope : 0.5,
    posture: src.posture ?? src.params?.posture ?? null,
    risk: src.risk ?? src.params?.risk ?? null,
    valueHypothesis: src.valueHypothesis ?? null,
    createdAt: src.createdAt ?? null,
  };
}
