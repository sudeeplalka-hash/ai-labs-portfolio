"use client";

import { usePathname } from "next/navigation";
import { Menu, GitBranch, CircleDot, Zap, FlaskConical } from "lucide-react";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Live RAG Evaluator Lab", subtitle: "Upload a document, ask questions, and watch the evaluator score the answer live." },
  "/overview": { title: "Executive Overview", subtitle: "RAG health, production readiness, and release recommendation at a glance." },
  "/live-rag-lab": { title: "Live RAG Evaluator Lab", subtitle: "Upload a document, ask questions, and watch the evaluator score the answer live." },
  "/evaluations": { title: "Evaluation Runs", subtitle: "Compare model, retriever, and prompt versions and detect regressions." },
  "/traces": { title: "Query Trace Explorer", subtitle: "Inspect retrieval, generation, citations, and claim level verification." },
  "/dataset": { title: "Golden Dataset", subtitle: "The evaluation test suite across domains, difficulty, and risk." },
  "/failures": { title: "Failure Analysis", subtitle: "Turn failure patterns into root causes and recommended fixes." },
  "/retrieval": { title: "Retrieval Quality", subtitle: "Precision, recall, ranking quality, and strategy experiments." },
  "/answers": { title: "Answer Quality", subtitle: "Faithfulness, completeness, citation accuracy, and failure examples." },
  "/operations": { title: "Cost & Latency", subtitle: "Production tradeoffs across latency, cost, and token usage." },
  "/governance": { title: "Governance", subtitle: "RAG maturity model and production readiness evidence." },
  "/quality-gates": { title: "Quality Gates", subtitle: "Release control: which gates pass, warn, or fail before promotion." },
};

export function Header({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const key = pathname === "/" ? "/" : "/" + (pathname.split("/")[1] ?? "");
  const meta = TITLES[key] ?? TITLES["/"];
  const isLab = key === "/" || key === "/live-rag-lab";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="rounded-lg border border-line p-2 text-slatey-300 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-ink md:text-xl">{meta.title}</h1>
              {isLab ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <FlaskConical className="h-3 w-3" /> Live feature
                </span>
              ) : (
                <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20 sm:inline-flex">
                  Control Tower · demo
                </span>
              )}
            </div>
            <p className="hidden text-sm text-slatey-400 sm:block">{meta.subtitle}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLab ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-slatey-300">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Runs in your browser · no API key
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-slatey-300">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                reranker-enabled-v4
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                <CircleDot className="h-3.5 w-3.5" />
                Hold
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
