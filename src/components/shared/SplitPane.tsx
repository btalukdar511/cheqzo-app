import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SplitPaneProps {
  list: ReactNode;
  detail: ReactNode;
  className?: string;
  listClassName?: string;
}

export function SplitPane({ list, detail, className, listClassName }: SplitPaneProps) {
  return (
    <div className={cn("flex h-[32rem] min-h-0 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]", className)}>
      <div className={cn("shrink-0 overflow-y-auto border-r border-border", listClassName ?? "w-[380px] min-w-[360px] max-w-[420px]")}>
        {list}
      </div>
      <div className="sticky top-0 min-w-0 flex-1 overflow-y-auto">{detail}</div>
    </div>
  );
}
