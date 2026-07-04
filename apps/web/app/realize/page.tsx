import type { Metadata } from "next";
import { RealizeStage } from "@/components/stages/RealizeStage";

export const metadata: Metadata = { title: "Realize · Business Outcome" };

export default function Page() {
  return <RealizeStage />;
}
