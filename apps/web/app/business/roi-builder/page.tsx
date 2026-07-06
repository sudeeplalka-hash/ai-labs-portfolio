import type { Metadata } from "next";
import { RoiBuilder } from "@/components/business/RoiBuilder";

export const metadata: Metadata = {
  title: "C3-5 · Business Case / ROI Builder",
  description:
    "Turn investment, value, adoption ramp, and discount rate into payback, NPV, and IRR, then a tornado sensitivity chart and a one-slide exec summary. Present the range, not the point.",
};

export default function Page() {
  return <RoiBuilder />;
}
