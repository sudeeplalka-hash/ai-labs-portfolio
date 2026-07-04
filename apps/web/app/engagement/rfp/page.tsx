import type { Metadata } from "next";
import { RfpWarRoom } from "@/components/engagement/RfpWarRoom";

export const metadata: Metadata = {
  title: "EL-07 · RFP/RFI Response War Room",
  description:
    "Decompose an AI-services RFP into a compliance matrix, set win themes, red-team the draft against the RFP's own criteria, and land a defensible bid / no-bid call.",
};

export default function Page() {
  return <RfpWarRoom />;
}
