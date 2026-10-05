import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { EstimationStudio } from "@/components/engagement/EstimationStudio";

export const metadata: Metadata = {
  ...routeMetadata("EL-08 \u00b7 Estimation and Scope Control Studio", "Inspect el-08 \u00b7 estimation and scope control studio through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/estimation"),
  title: "EL-08 · Estimation and Scope Control Studio",
  description:
    "Estimate an AI engagement three ways, bottom up, analogous, and three point PERT, watch them disagree, staff it, then run a scope change through change control and see margin move.",
};

export default function Page() {
  return <EstimationStudio />;
}
