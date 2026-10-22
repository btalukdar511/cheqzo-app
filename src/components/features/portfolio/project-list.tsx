"use client";

import { HealthBadge } from "@/components/shared/HealthBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SeedImage } from "@/components/shared/SeedImage";
import { formatDate } from "@/lib/format";
import type { PortfolioItem } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

function meta(item: PortfolioItem) {
  const { project, summary } = item;
  return {
    typeLine: `${project.bhk} ${project.propertyType} · ${project.areaSqft.toLocaleString("en-IN")} sqft`,
    place: `${project.location.area}, ${project.location.city}`,
    dates: `${formatDate(summary.originalEndDate)} → ${formatDate(summary.projectedEndDate)}`,
    progress: `${Math.round(summary.progress)}%`,
  };
}

export function ProjectList({
  items,
  selectedId,
  layout,
  onSelect,
  onOpen,
}: {
  items: PortfolioItem[];
  selectedId: string | null;
  layout: "list" | "grid";
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <ul className={cn(layout === "grid" ? "grid grid-cols-2 gap-3 p-3" : "divide-y divide-border")}>
      {items.map((item) => {
        const selected = item.project.id === selectedId;
        const details = meta(item);
        return (
          <li key={item.project.id}>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onSelect(item.project.id)}
              onDoubleClick={() => onOpen(item.project.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onOpen(item.project.id);
              }}
              className={cn(
                "w-full cursor-pointer text-left",
                layout === "grid" ? "rounded-xl border border-border p-3" : "flex gap-3 px-4 py-3",
                selected && "bg-primary/10",
              )}
            >
              <span className={cn("relative block shrink-0 overflow-hidden rounded-lg", layout === "grid" ? "mb-3 aspect-[3/2] w-full" : "size-16")}>
                <SeedImage src={item.project.coverImage} alt="" sizes={layout === "grid" ? "240px" : "64px"} />
              </span>
              <span className="block min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-5 text-foreground">{item.project.name}</span>
                  <HealthBadge health={item.summary.health} reasons={item.summary.reasons} />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{details.typeLine}</span>
                <span className="block text-xs text-muted-foreground">{details.place}</span>
                <span className="mt-2 block">
                  <ProgressBar value={item.summary.progress} label={details.progress} />
                </span>
                <span className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{details.dates}</span>
                  {item.pendingUpdates > 0 ? <span className="font-medium text-warning">{item.pendingUpdates} pending</span> : null}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
