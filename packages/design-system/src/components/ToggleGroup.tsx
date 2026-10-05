"use client";
import { cn } from "../lib/cn";

export interface ToggleGroupProps {
  label: string;
  value: string;
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  className?: string;
}
/** A choice group uses native buttons, so Tab/Enter/Space require no custom model. */
export function ToggleGroup({ label, value, options, onChange, className }: ToggleGroupProps) {
  return <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>{options.map((option) => <button key={option.value} type="button" disabled={option.disabled} aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={cn("min-h-10 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50", value === option.value ? "border-primary bg-primary-soft font-semibold text-primary-dark" : "border-line bg-white text-slatey-300 hover:border-primary/50")}><span>{option.label}</span>{option.description && <span className="mt-1 block text-xs font-normal">{option.description}</span>}</button>)}</div>;
}
