"use client";

import { useState } from "react";
import { Send, Bot, Lock, Loader2, Search, Brain, CircleDot, MessageSquare } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { EngineBadge } from "@rag/components/common/EngineBadge";
import type { GeneratedLiveAnswer } from "@rag/types/liveLab";
import type { QueryStage } from "@rag/types/liveLab";
import { cn } from "@rag/lib/cn";

interface Props {
  ready: boolean;
  isAnswering: boolean;
  queryStage: QueryStage | null;
  sampleQuestions: string[];
  latestQuestion?: string;
  latestAnswer?: GeneratedLiveAnswer;
  onAsk: (q: string) => void;
}

const STAGES: { id: QueryStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "retrieving", label: "Retrieving", icon: Search },
  { id: "generating", label: "Generating", icon: Bot },
  { id: "evaluating", label: "Evaluating", icon: Brain },
];

export function LiveDocumentChat({ ready, isAnswering, queryStage, sampleQuestions, latestQuestion, latestAnswer, onAsk }: Props) {
  const [input, setInput] = useState("");
  const submit = (q: string) => {
    if (!q.trim() || isAnswering || !ready) return;
    onAsk(q.trim());
    setInput("");
  };
  const order: QueryStage[] = ["retrieving", "generating", "evaluating"];
  const cur = queryStage ? order.indexOf(queryStage) : -1;

  return (
    <Panel className="flex flex-col">
      <SectionHeader title="Ask the document" description="The evaluator scores every answer below." icon={MessageSquare} />

      {/* Conversation area */}
      <div className="min-h-[150px] flex-1">
        {!ready ? (
          <div className="flex h-full items-center gap-2 rounded-lg border border-dashed border-line bg-slate-50 p-4">
            <Lock className="h-4 w-4 shrink-0 text-slatey-500" />
            <p className="text-sm text-slatey-400">Load a document on the left, then ask a question here.</p>
          </div>
        ) : !latestQuestion ? (
          <div className="space-y-3">
            <p className="text-sm text-slatey-400">Ready. Ask anything about the document — or try one of these:</p>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  disabled={isAnswering}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-slatey-300 hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="ml-auto max-w-[90%] rounded-lg rounded-br-sm bg-primary/10 px-3 py-2 text-sm text-ink ring-1 ring-inset ring-primary/20">
              {latestQuestion}
            </div>
            {latestAnswer && !isAnswering && (
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink">
                  <Bot className="h-4 w-4 text-white" />
                </span>
                <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-line bg-white px-3 py-2 text-sm leading-relaxed text-slatey-200">
                  {latestAnswer.answer}
                  <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-1.5">
                    <EngineBadge mode={latestAnswer.mode} label={latestAnswer.engineLabel} size="xs" />
                    {latestAnswer.engineLabel && (
                      <span className="truncate text-[11px] text-slatey-500">{latestAnswer.engineLabel}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {isAnswering && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/[0.05] px-3 py-2">
                {STAGES.map((st, i) => {
                  const done = i < cur;
                  const active = i === cur;
                  const Icon = st.icon;
                  return (
                    <div key={st.id} className="flex items-center gap-1.5">
                      {done ? (
                        <CircleDot className="h-3.5 w-3.5 text-emerald-600" />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Icon className="h-3.5 w-3.5 text-slatey-500" />
                      )}
                      <span className={cn("text-xs", active ? "font-medium text-primary" : done ? "text-emerald-700" : "text-slatey-500")}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ready ? "Ask a question…" : "Load a document first"}
          disabled={!ready || isAnswering}
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slatey-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:bg-slate-50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!ready || isAnswering || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnswering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
      </form>
    </Panel>
  );
}
