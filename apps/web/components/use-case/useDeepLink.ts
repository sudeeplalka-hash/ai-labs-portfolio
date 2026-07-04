"use client";

// Deep-link the use-case layer: a lab reading ?uc=<id> auto-selects that use-case
// on mount, so the Industry Atlas and the Storylines can link straight to "this
// instrument, reconfigured for this industry." Runs once, client-side only (safe
// under static export — no server, no Suspense boundary needed), and no-ops if the
// param is absent or unknown, so the lab just opens at its default.

import { useEffect, useRef } from "react";

export function useUseCaseDeepLink(validIds: string[], onSelect: (id: string) => void) {
  const ran = useRef(false);
  const cb = useRef(onSelect);
  cb.current = onSelect;
  const ids = useRef(validIds);
  ids.current = validIds;

  useEffect(() => {
    if (ran.current || typeof window === "undefined") return;
    ran.current = true;
    const uc = new URLSearchParams(window.location.search).get("uc");
    if (uc && ids.current.includes(uc)) cb.current(uc);
  }, []);
}
