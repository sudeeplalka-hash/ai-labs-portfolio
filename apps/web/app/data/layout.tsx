import { DataSliceWriter } from "@/components/bridges/DataSliceWriter";

// Navigation lives in the left sidebar; no in-page subnav needed.
export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DataSliceWriter />
      {children}
    </div>
  );
}
