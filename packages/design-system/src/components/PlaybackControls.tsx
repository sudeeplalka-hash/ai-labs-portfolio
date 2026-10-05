"use client";
import { Pause, Play, RotateCcw, SkipForward, StepForward } from "lucide-react";
import type { usePlayback } from "../lib/motion";

export function PlaybackControls({ playback, steps, label = "Explanation playback" }: { playback: ReturnType<typeof usePlayback>; steps: number; label?: string }) {
  const button = "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slatey-300 hover:border-primary/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";
  return <div className="no-print space-y-2">
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {!playback.reducedMotion && <button type="button" onClick={playback.playing ? playback.pause : playback.play} className={button}>{playback.playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}{playback.playing ? "Pause" : playback.index >= steps ? "Replay" : "Play"}</button>}
      <button type="button" onClick={playback.next} disabled={playback.index >= steps} className={button}><StepForward aria-hidden className="h-4 w-4" />Step</button>
      <button type="button" onClick={playback.complete} disabled={playback.index >= steps} className={button}><SkipForward aria-hidden className="h-4 w-4" />Show outcome</button>
      <button type="button" onClick={playback.reset} className={button}><RotateCcw aria-hidden className="h-4 w-4" />Start of explanation</button>
      {!playback.reducedMotion && <label className="inline-flex items-center gap-2 text-xs text-slatey-400">Replay speed<select aria-label="Explanation replay speed" value={playback.speed} onChange={(event) => playback.setSpeed(Number(event.target.value))} className="min-h-10 rounded-lg border border-line bg-white px-2 text-sm">{[0.5, 1, 2].map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>}
      <span role="status" className="text-xs tabular-nums text-slatey-500">{playback.index} / {steps} steps</span>
    </div>
    <p className="text-xs text-slatey-500">{playback.reducedMotion ? "Reduced motion: use Step to inspect each state, or read the complete outcome." : "Playback explains recorded states. Replay speed does not change results or measured runtime."}</p>
  </div>;
}
