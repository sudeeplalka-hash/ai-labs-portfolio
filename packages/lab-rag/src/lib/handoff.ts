// ============================================================================
// Inbound handoff from the AI Program Command Center (Strategy & Framing lab).
// Reads the framed initiative from a `?initiative=` URL payload (cross-origin /
// cross dev-port) or from same-origin localStorage `apcc_state`. Additive only:
// nothing here mutates this lab's own state.
// ============================================================================
export interface FramingHandoff {
  name: string;
  sharpenedProblem: string | null;
  scores: { value: number; feasibility: number; dataReadiness: number };
  scope: number;
  posture: string | null;
  risk: string | null;
  valueHypothesis: string | null;
  createdAt: string | null;
}

type Raw = Record<string, unknown> & {
  name?: string | null;
  sharpenedProblem?: string | null;
  scores?: { value?: number; feasibility?: number; dataReadiness?: number };
  scope?: number;
  posture?: string | null;
  risk?: string | null;
  valueHypothesis?: string | null;
  createdAt?: string | null;
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
    const raw = window.localStorage.getItem("apcc_state");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { initiative?: Raw };
    return parsed?.initiative ?? null;
  } catch { return null; }
}

export function readHandoff(): FramingHandoff | null {
  const src = fromUrl() ?? fromStorage();
  if (!src || !src.name) return null; // only after a bet is locked in Framing
  const s = src.scores ?? {};
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
