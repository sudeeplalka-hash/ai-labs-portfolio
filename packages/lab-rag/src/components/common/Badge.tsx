import { cn } from "@rag/lib/cn";
import {
  RISK_STYLES,
  STATUS_STYLES,
  GATE_STYLES,
  RELEASE_STYLES,
  SUPPORT_STYLES,
  EVAL_STATUS_STYLES,
  FRESHNESS_STYLES,
} from "@rag/lib/constants";
import type {
  RiskLevel,
  Status,
  GateStatus,
  ReleaseRecommendation,
  SupportStatus,
  EvaluationStatus,
  FreshnessStatus,
} from "@rag/types";

const base =
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return <span className={cn(base, RISK_STYLES[level], className)}>{level}</span>;
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn(base, STATUS_STYLES[status], className)}>{status}</span>;
}

export function GateBadge({ status, className }: { status: GateStatus; className?: string }) {
  return <span className={cn(base, GATE_STYLES[status], className)}>{status}</span>;
}

export function ReleaseBadge({
  recommendation,
  className,
}: {
  recommendation: ReleaseRecommendation;
  className?: string;
}) {
  return <span className={cn(base, RELEASE_STYLES[recommendation], className)}>{recommendation}</span>;
}

export function SupportBadge({ status, className }: { status: SupportStatus; className?: string }) {
  return <span className={cn(base, SUPPORT_STYLES[status], className)}>{status}</span>;
}

export function EvalStatusBadge({
  status,
  className,
}: {
  status: EvaluationStatus;
  className?: string;
}) {
  return <span className={cn(base, EVAL_STATUS_STYLES[status], className)}>{status}</span>;
}

export function FreshnessBadge({
  status,
  className,
}: {
  status: FreshnessStatus;
  className?: string;
}) {
  return <span className={cn(base, FRESHNESS_STYLES[status], className)}>{status}</span>;
}
