import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { ExecCommStudio } from "@/components/engagement/ExecCommStudio";

export const metadata: Metadata = {
  ...routeMetadata("EL-10 \u00b7 Executive Communication Decision Studio", "Inspect el-10 \u00b7 executive communication decision studio through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/exec-comms"),
  title: "EL-10 · Executive Communication Decision Studio",
  description:
    "Turns live delivery data into a steering pre read, weekly update, or QBR outline, structured into status, decisions, risks, and asks, rewritten per audience, with a talk track per section.",
};

export default function Page() {
  return <ExecCommStudio />;
}
