import { cn } from "@data/lib/cn";

export function Panel({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return <section id={id} className={cn("panel min-w-0 p-4 sm:p-5", className)}>{children}</section>;
}
