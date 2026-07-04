import type { Metadata } from "next";
import { CompetencyMap } from "@/components/map/CompetencyMap";

// Layer 0 — the Command Center landing IS the Competency Map (Appendix 1).
export const metadata: Metadata = {
  title: "Sudeep Lalka — AI Delivery Leadership Portfolio",
  description:
    "One AI delivery leader at four altitudes: the protocol wire, the program lifecycle, the P&L, and the people. A working portfolio of instruments, each mapped to a real enterprise decision.",
};

export default function Page() {
  return <CompetencyMap />;
}
