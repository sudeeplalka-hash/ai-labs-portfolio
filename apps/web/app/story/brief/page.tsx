import type { Metadata } from "next";
import { BoardBrief } from "@/components/story/BoardBrief";

export const metadata: Metadata = { title: "Board Brief" };

export default function Page() {
  return <BoardBrief />;
}
