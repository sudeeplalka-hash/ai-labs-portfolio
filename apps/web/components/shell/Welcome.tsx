"use client";

// Phase H, first-visit welcome. The Command Center is comprehensive by design,
// which can overwhelm on arrival. This full-screen gate offers three doors, // watch it working, read the story, or explore alone, then never appears again
// (localStorage). Deep links to labs skip it entirely; it only guards "/".

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, BookOpen, MousePointerClick, ArrowRight } from "lucide-react";
import { useSampleProgram } from "@/components/reviewer/SampleProgram";

const WELCOME_KEY = "apcc_welcomed";
const STAGES_LINE = ["Strategy", "Data", "Build", "Operate", "Govern", "Realize"];

export function Welcome() {
  const router = useRouter();
  const { hydrated, load } = useSampleProgram();
  // Assume welcomed until we can read storage, avoids flashing the gate for
  // returning visitors during hydration.
  const [welcomed, setWelcomed] = useState(true);
  useEffect(() => {
    try { setWelcomed(window.localStorage.getItem(WELCOME_KEY) === "1"); } catch { /* private mode */ }
  }, []);

  const dismiss = () => {
    try { window.localStorage.setItem(WELCOME_KEY, "1"); } catch { /* private mode */ }
    setWelcomed(true);
  };

  if (!hydrated || welcomed) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-ink via-ink to-[#1a3050]">
      <div className="flex min-h-full items-center justify-center px-5 py-10">
        <div className="w-full max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">AI Program Command Center</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Every enterprise has an AI idea.<br className="hidden sm:block" /> This is how one becomes <span className="text-sky-300">real</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Six labs walk one initiative from a rough ambition to a governed, measurable business case,
            with every stage handing a real contract to the next.
          </p>

          {/* The loop, in one line */}
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 font-mono text-[11px] text-slate-400">
            {STAGES_LINE.map((s, i) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-600">→</span>}
                <span>{s}</span>
              </span>
            ))}
            <span className="text-slate-600">↺</span>
          </p>

          {/* Three doors */}
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <button
              onClick={() => { load(); dismiss(); }}
              className="group flex flex-col rounded-xl border border-sky-400/40 bg-sky-400/10 p-4 transition-colors hover:bg-sky-400/20"
            >
              <PlayCircle className="h-5 w-5 text-sky-300" />
              <span className="mt-2 text-sm font-semibold text-white">See it working</span>
              <span className="mt-1 flex-1 text-xs leading-relaxed text-slate-300">
                Load a complete sample program: every stage populated, every number traceable.
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-300">
                Recommended <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              onClick={() => { dismiss(); router.push("/story"); }}
              className="group flex flex-col rounded-xl border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-5 w-5 text-slate-300" />
              <span className="mt-2 text-sm font-semibold text-white">Read the story</span>
              <span className="mt-1 flex-1 text-xs leading-relaxed text-slate-300">
                The whole program in six beats: two minutes, no clicking around.
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                Two minute read <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <button
              onClick={dismiss}
              className="group flex flex-col rounded-xl border border-white/15 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <MousePointerClick className="h-5 w-5 text-slate-300" />
              <span className="mt-2 text-sm font-semibold text-white">Explore on my own</span>
              <span className="mt-1 flex-1 text-xs leading-relaxed text-slate-300">
                Straight to the Command Center. Every lab works standalone.
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                Enter <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>

          <p className="mt-8 text-[11px] text-slate-500">
            Runs entirely in your browser · deterministic engines · no keys, no backend, no data leaves this page
          </p>
        </div>
      </div>
    </div>
  );
}
