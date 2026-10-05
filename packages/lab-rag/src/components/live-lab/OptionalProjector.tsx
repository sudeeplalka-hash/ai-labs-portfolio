"use client";
import { Component, lazy, Suspense, useRef, useState, type ReactNode } from "react";
import type { DocumentChunk, LiveRagLabTrace } from "@rag/types/liveLab";

const MAX_RETRIES = 2;
const createProjector = () => lazy(() => import("./EmbeddingProjectorPanel").then((module) => ({ default: module.EmbeddingProjectorPanel })));

class ProjectorBoundary extends Component<{ children: ReactNode; retry?: () => void; close: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="status" className="rounded-xl border border-line p-4 text-sm">
      <p>The spatial view could not load. Your document, chunks and answers are unchanged. All source passages remain available in Chunk Explorer above.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {this.props.retry && <button type="button" onClick={this.props.retry} className="min-h-11 rounded-lg border border-line px-3 font-medium">Retry spatial view</button>}
        <button type="button" onClick={this.props.close} className="min-h-11 rounded-lg border border-line px-3 font-medium">Close spatial view</button>
      </div>
    </div>;
  }
}

export function OptionalProjector({ chunks, trace }: { chunks: DocumentChunk[]; trace: LiveRagLabTrace | null }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [{ Projector, attempt }, setLoader] = useState(() => ({ Projector: createProjector(), attempt: 0 }));
  const retry = () => {
    // The error button is removed during retry; keep focus in this disclosure.
    trigger.current?.focus();
    // A fresh lazy instance clears React's cached rejection; only this optional
    // subtree remounts, so the parent document, chunks and answer state survive.
    setLoader((current) => current.attempt >= MAX_RETRIES ? current : { Projector: createProjector(), attempt: current.attempt + 1 });
  };
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <section className="rounded-xl border border-line bg-white p-4">
    <button ref={trigger} type="button" className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold" aria-expanded={open} onClick={() => setOpen((value) => !value)}>Optional: explore similarity in 3D <span aria-hidden>{open ? "−" : "+"}</span></button>
    <p className="mb-3 text-xs text-slatey-400">A spatial explanation of the same chunks. Evidence and complete passages remain available above.</p>
    {open && <ProjectorBoundary key={attempt} retry={attempt < MAX_RETRIES ? retry : undefined} close={close}>
      <Suspense fallback={<div role="status" className="min-h-48 p-6 text-sm">Loading the optional spatial view…</div>}><Projector chunks={chunks} trace={trace} /></Suspense>
    </ProjectorBoundary>}
  </section>;
}
