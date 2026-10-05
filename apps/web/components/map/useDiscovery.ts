"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useDiscovery(keys: readonly string[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  const pendingRestore = useRef<{ id: string; scroll: number } | null>(null);
  const keyString = keys.join(",");
  useEffect(() => {
    const read = () => {
      const params = new URLSearchParams(window.location.search);
      setValues(Object.fromEntries(keyString.split(",").map((key) => [key, params.get(key) ?? ""])));
    };
    read();
    window.addEventListener("popstate", read);
    try {
      const receipt = JSON.parse(sessionStorage.getItem(`discovery:${location.pathname}`) ?? "null");
      if (receipt?.href === location.href) pendingRestore.current = receipt;
    } catch { /* URL navigation still works without storage. */ }
    return () => window.removeEventListener("popstate", read);
  }, [keyString]);
  useEffect(() => {
    const receipt = pendingRestore.current;
    if (!receipt) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(receipt.id);
      if (target) {
        target.focus({ preventScroll: true });
        window.scrollTo({ top: receipt.scroll, behavior: "instant" as ScrollBehavior });
        pendingRestore.current = null;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [values]);
  const update = useCallback((patch: Record<string, string>) => {
    setValues((current) => ({ ...current, ...patch }));
    const url = new URL(window.location.href);
    Object.entries(patch).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    window.history.replaceState(null, "", url);
  }, []);
  const remember = (id: string) => {
    try { sessionStorage.setItem(`discovery:${location.pathname}`, JSON.stringify({ id, href: location.href, scroll: window.scrollY })); } catch { /* optional */ }
  };
  return { values, update, remember };
}
