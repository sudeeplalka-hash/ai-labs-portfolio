import type { Metadata } from "next";
import { PortfolioDashboard } from "@/components/business/PortfolioDashboard";

export const metadata: Metadata = {
  title: "C3-1 · AI Initiative Portfolio Dashboard",
  description:
    "Twelve AI initiatives plotted value × risk and sized by spend, each with a risk adjusted ROI and a kill / scale / hold call, the way a real portfolio owner governs a book of work.",
};

export default function Page() {
  return <PortfolioDashboard />;
}
