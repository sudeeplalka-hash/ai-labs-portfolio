import { BuildSliceWriter } from "@/components/bridges/BuildSliceWriter";

// Navigation lives in the left sidebar; no in-page subnav needed.
export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BuildSliceWriter />
      {children}
    </div>
  );
}
