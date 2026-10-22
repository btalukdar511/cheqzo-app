"use client";

import { LayoutGrid, List } from "lucide-react";

import type { HealthFilter, PortfolioSort } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const FILTERS: { id: HealthFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "on_track", label: "On Track" },
  { id: "needs_attention", label: "Needs Attention" },
  { id: "at_risk", label: "At Risk" },
];

const SORTS: { id: PortfolioSort; label: string }[] = [
  { id: "health", label: "Health" },
  { id: "progress", label: "Progress" },
  { id: "deadline", label: "Deadline" },
];

export function PortfolioToolbar({
  health,
  sort,
  layout,
  onHealth,
  onSort,
  onLayout,
}: {
  health: HealthFilter;
  sort: PortfolioSort;
  layout: "list" | "grid";
  onHealth: (health: HealthFilter) => void;
  onSort: (sort: PortfolioSort) => void;
  onLayout: (layout: "list" | "grid") => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Health">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={health === filter.id}
            onClick={() => onHealth(filter.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              health === filter.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="portfolio-sort">
          Sort
        </label>
        <select
          id="portfolio-sort"
          value={sort}
          onChange={(event) => onSort(event.target.value as PortfolioSort)}
          className="h-8 rounded-lg border border-border bg-surface px-2 text-sm"
        >
          {SORTS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-border bg-surface p-0.5" role="group" aria-label="Layout">
          <button type="button" aria-pressed={layout === "list"} aria-label="List" className={cn("rounded-md p-1.5", layout === "list" && "bg-secondary")} onClick={() => onLayout("list")}>
            <List className="size-4" />
          </button>
          <button type="button" aria-pressed={layout === "grid"} aria-label="Grid" className={cn("rounded-md p-1.5", layout === "grid" && "bg-secondary")} onClick={() => onLayout("grid")}>
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
