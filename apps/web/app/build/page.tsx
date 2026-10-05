import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { BuildStage } from "@/components/stages/BuildStage";

export const metadata: Metadata = {
  ...routeMetadata("Build \u00b7 RAG", "Inspect build \u00b7 rag through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/build"), title: "Build · RAG" };

export default function Page() {
  return <BuildStage />;
}
