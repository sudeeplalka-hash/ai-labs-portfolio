"use client";

import { useEffect, useState, type ComponentProps, type ComponentType } from "react";
import type { CorpusAtlas3D } from "./CorpusAtlas3D";

type Props = ComponentProps<typeof CorpusAtlas3D>;

/** Requested only when the visitor opens 3D; corpus state remains with its owner. */
export function OptionalCorpusAtlas(props: Props & { onFallback: () => void }) {
  const [Atlas, setAtlas] = useState<ComponentType<Props> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setError(false);
    import("./CorpusAtlas3D").then((module) => {
      if (current) setAtlas(() => module.CorpusAtlas3D);
    }).catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [attempt]);
  if (Atlas) return <Atlas {...props} />;
  return <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line p-5 text-center text-sm">
    <p role="status">{error ? "The optional 3D map could not load. Your files, selection and findings are still available." : "Loading the optional 3D map…"}</p>
    <div className="flex flex-wrap justify-center gap-3">
      {error && <button className="rounded-lg border border-line px-3 py-2 font-medium" onClick={() => setAttempt((value) => value + 1)}>Retry 3D map</button>}
      <button className="rounded-lg border border-line px-3 py-2 font-medium" onClick={props.onFallback}>Use 2D map</button>
      <a className="rounded-lg px-3 py-2 text-primary underline" href="#corpus-files">Use the file list</a>
    </div>
  </div>;
}
