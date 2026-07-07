import { ShieldCheck } from "lucide-react";
import { ClaimCard } from "./ClaimCard";
import { calculateClaimSupportScore } from "@rag/lib/scoring";
import type { ClaimVerification } from "@rag/types";

export function ClaimVerificationPanel({ claims }: { claims: ClaimVerification[] }) {
  const score = calculateClaimSupportScore(claims);
  const supported = claims.filter((c) => c.supportStatus === "Supported").length;
  const flagged = claims.filter(
    (c) => c.supportStatus === "Unsupported" || c.supportStatus === "Contradicted",
  ).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent-cyan" />
          <h3 className="text-sm font-semibold text-ink">Claim Level Verification</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slatey-400">
          <span>
            Claim support <span className="font-semibold text-ink">{score}%</span>
          </span>
          <span className="text-emerald-700">{supported} supported</span>
          {flagged > 0 && <span className="text-rose-700">{flagged} flagged</span>}
        </div>
      </div>
      <div className="space-y-3">
        {claims.map((c) => (
          <ClaimCard key={c.id} claim={c} />
        ))}
      </div>
    </div>
  );
}
