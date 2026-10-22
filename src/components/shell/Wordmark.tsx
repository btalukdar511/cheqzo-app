import { cn } from "@/lib/utils";

export function Wordmark({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl leading-none font-semibold tracking-tight",
        light ? "text-primary-foreground" : "text-foreground",
        className,
      )}
    >
      <span aria-hidden className="size-2.5 rounded-[3px] bg-primary" />
      Cheqzo
    </span>
  );
}
