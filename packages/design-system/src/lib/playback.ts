export function clampPlaybackStep(index: number, steps: number): number {
  return Math.max(0, Math.min(Math.max(0, Math.floor(steps)), Number.isFinite(index) ? Math.floor(index) : 0));
}

export function nextPlaybackStep(index: number, steps: number): number {
  return clampPlaybackStep(index + 1, steps);
}

export function playbackDelay(intervalMs: number, speed: number): number {
  return Math.max(80, (Number.isFinite(intervalMs) ? Math.max(80, intervalMs) : 750) / (Number.isFinite(speed) && speed > 0 ? speed : 1));
}

export const MOTION = {
  feedback: 140,
  disclosure: 180,
  comparison: 220,
  reset: 280,
  step: 750,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
