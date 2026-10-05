import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { RfpWarRoom } from "@/components/engagement/RfpWarRoom";

export const metadata: Metadata = {
  ...routeMetadata("EL-07 \u00b7 RFP and Bid Decision War Room", "Inspect el-07 \u00b7 rfp and bid decision war room through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/rfp"),
  title: "EL-07 · RFP and Bid Decision War Room",
  description:
    "Decompose an AI services RFP into a compliance matrix, set win themes, red team the draft against the RFP's own criteria, and land a defensible bid / no bid call.",
};

export default function Page() {
  return <RfpWarRoom />;
}
