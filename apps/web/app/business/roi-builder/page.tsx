import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { RoiBuilder } from "@/components/business/RoiBuilder";

export const metadata: Metadata = {
  ...routeMetadata("C3-5 \u00b7 AI Business Case and ROI Builder", "Inspect c3-5 \u00b7 ai business case and roi builder through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/business/roi-builder"),
  title: "C3-5 · AI Business Case and ROI Builder",
  description:
    "Turn investment, value, adoption ramp, and discount rate into payback, NPV, and IRR, then a tornado sensitivity chart and a one slide exec summary. Present the range, not the point.",
};

export default function Page() {
  return <RoiBuilder />;
}
