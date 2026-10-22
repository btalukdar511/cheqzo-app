"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { DEMO_DESIGNER_ID, DEMO_HOMEOWNER_ID } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const OPTIONS = [
  { id: DEMO_HOMEOWNER_ID, label: "Homeowner view" },
  { id: DEMO_DESIGNER_ID, label: "Designer view" },
] as const;

export function RoleSwitcher() {
  const userId = useSession((state) => state.userId);
  const setUserId = useSession((state) => state.setUserId);
  const router = useRouter();

  function select(nextId: string) {
    if (nextId === userId) return;
    setUserId(nextId);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Badge variant="outline" className="border-brass/40 text-brass">
        Demo
      </Badge>
      <div className="flex rounded-lg border border-border bg-background p-0.5" role="group" aria-label="Demo role">
        {OPTIONS.map((option) => {
          const selected = userId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => select(option.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
