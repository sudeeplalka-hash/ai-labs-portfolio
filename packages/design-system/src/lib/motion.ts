"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { clampPlaybackStep, nextPlaybackStep, playbackDelay, MOTION } from "./playback";

export function useReducedMotion(): boolean {
  // Safe first render: never begin an automatic animation before preference is known.
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

export function useInViewport(ref: RefObject<Element>, margin = "80px"): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: margin });
    observer.observe(target);
    return () => observer.disconnect();
  }, [ref, margin]);
  return visible;
}

export function scrollToElement(element: Element | null, options: ScrollIntoViewOptions = {}): void {
  if (!element) return;
  element.scrollIntoView({ block: "nearest", ...options, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : (options.behavior ?? "smooth") });
}

export interface PlaybackOptions {
  steps: number;
  intervalMs?: number;
  initiallyComplete?: boolean;
  /** Caller can pass useInViewport(ref) to suspend offscreen explanations. */
  visible?: boolean;
}

/** Presentation clock only: never use this index to measure or compute results. */
export function usePlayback({ steps, intervalMs = MOTION.step, initiallyComplete = true, visible = true }: PlaybackOptions) {
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();
  const [index, setRawIndex] = useState(initiallyComplete ? steps : 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setRawSpeed] = useState(1);
  const priorSteps = useRef(steps);
  const setIndex = useCallback((value: number) => { setPlaying(false); setRawIndex(clampPlaybackStep(value, steps)); }, [steps]);
  const setSpeed = useCallback((value: number) => setRawSpeed(Math.max(0.25, Math.min(4, value || 1))), []);
  const pause = useCallback(() => setPlaying(false), []);
  const complete = useCallback(() => { setPlaying(false); setRawIndex(steps); }, [steps]);
  const reset = useCallback(() => { setPlaying(false); setRawIndex(0); }, []);
  const next = useCallback(() => { setPlaying(false); setRawIndex((current) => nextPlaybackStep(current, steps)); }, [steps]);
  const play = useCallback(() => {
    if (reducedMotion) { complete(); return; }
    setRawIndex((current) => current >= steps ? 0 : current);
    setPlaying(true);
  }, [reducedMotion, complete, steps]);
  const replay = useCallback(() => { setRawIndex(0); if (reducedMotion) complete(); else setPlaying(true); }, [reducedMotion, complete]);
  useEffect(() => {
    if (priorSteps.current !== steps) {
      priorSteps.current = steps;
      setPlaying(false);
      setRawIndex(initiallyComplete ? steps : 0);
    }
  }, [steps, initiallyComplete]);
  useEffect(() => {
    if (!pageVisible || !visible || reducedMotion) setPlaying(false);
  }, [pageVisible, visible, reducedMotion]);
  useEffect(() => {
    window.addEventListener("resize", pause);
    return () => window.removeEventListener("resize", pause);
  }, [pause]);
  useEffect(() => {
    if (!playing || !pageVisible || !visible || reducedMotion) return;
    if (index >= steps) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setRawIndex((current) => nextPlaybackStep(current, steps)), playbackDelay(intervalMs, speed));
    return () => window.clearTimeout(timer);
  }, [playing, index, steps, intervalMs, speed, pageVisible, visible, reducedMotion]);
  return { index: clampPlaybackStep(index, steps), playing, speed, reducedMotion, play, pause, next, reset, complete, replay, setIndex, setSpeed };
}
