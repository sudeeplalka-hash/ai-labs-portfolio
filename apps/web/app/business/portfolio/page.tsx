import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { PortfolioDashboard } from "@/components/business/PortfolioDashboard";

export const metadata: Metadata = {
  ...routeMetadata("C3-1 \u00b7 AI Portfolio Capital Allocation Dashboard", "Inspect c3-1 \u00b7 ai portfolio capital allocation dashboard through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/business/portfolio"),
  title: "C3-1 · AI Portfolio Capital Allocation Dashboard",
  description:
    "Twelve AI initiatives plotted value × risk and sized by spend, each with a risk adjusted ROI and a kill / scale / hold call, the way a real portfolio owner governs a book of work.",
};

export default function Page() {
  return <PortfolioDashboard />;
}
