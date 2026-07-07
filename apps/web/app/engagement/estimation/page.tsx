import type { Metadata } from "next";
import { EstimationStudio } from "@/components/engagement/EstimationStudio";

export const metadata: Metadata = {
  title: "EL-08 · Estimation and Scope Control Studio",
  description:
    "Estimate an AI engagement three ways, bottom up, analogous, and three point PERT, watch them disagree, staff it, then run a scope change through change control and see margin move.",
};

export default function Page() {
  return <EstimationStudio />;
}
