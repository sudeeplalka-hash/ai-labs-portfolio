import type { Metadata } from "next";
import { ExecCommStudio } from "@/components/engagement/ExecCommStudio";

export const metadata: Metadata = {
  title: "EL-10 · Executive Communication Decision Studio",
  description:
    "Turns live delivery data into a steering pre read, weekly update, or QBR outline, structured into status, decisions, risks, and asks, rewritten per audience, with a talk track per section.",
};

export default function Page() {
  return <ExecCommStudio />;
}
