import { SearchX } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line py-12 text-center">
      <SearchX className="h-6 w-6 text-slatey-500" />
      <p className="text-sm text-slatey-400">{message}</p>
    </div>
  );
}
