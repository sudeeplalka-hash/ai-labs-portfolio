import { Cpu, Sparkles } from "lucide-react";
import { cn } from "@rag/lib/cn";

/**
 * Small tag showing which engine produced an answer/trace:
 * "LLM" (real model via BYO key) vs "Simulated" (deterministic in-browser engine).
 * `label` (e.g. "OpenAI · gpt-4o-mini") is surfaced as a tooltip.
 */
export function EngineBadge({
  mode,
  label,
  size = "sm",
  className,
}: {
  mode: "simulated" | "llm";
  label?: string;
  size?: "xs" | "sm";
  className?: string;
}) {
  const isLlm = mode === "llm";
  const Icon = isLlm ? Cpu : Sparkles;
  return (
    <span
      title={label ?? (isLlm ? "Answered by a real LLM (your API key)" : "Deterministic in-browser engine — no API key")}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium uppercase tracking-wide ring-1 ring-inset whitespace-nowrap",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        isLlm
          ? "bg-primary/10 text-primary ring-primary/20"
          : "bg-slate-100 text-slate-600 ring-slate-400/25",
        className,
      )}
    >
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {isLlm ? "LLM" : "Simulated"}
    </span>
  );
}
