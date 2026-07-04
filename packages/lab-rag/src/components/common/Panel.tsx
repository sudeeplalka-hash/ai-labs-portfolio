import { cn } from "@rag/lib/cn";

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("panel p-5", className)}>{children}</section>;
}
