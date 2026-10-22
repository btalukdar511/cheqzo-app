"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Health } from "@/types";

const HEALTH_LABEL: Record<Health, string> = {
  on_track: "On Track",
  needs_attention: "Needs Attention",
  at_risk: "At Risk",
};

const HEALTH_DOT: Record<Health, string> = {
  on_track: "bg-success",
  needs_attention: "bg-warning",
  at_risk: "bg-danger",
};

interface HealthBadgeProps {
  health: Health;
  reasons?: string[];
}

export function HealthBadge({ health, reasons = [] }: HealthBadgeProps) {
  const detail = reasons.length > 0 ? reasons.join(" · ") : "On track";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
          <span className={`size-1.5 rounded-full ${HEALTH_DOT[health]}`} />
          {HEALTH_LABEL[health]}
        </span>
      </TooltipTrigger>
      <TooltipContent>{detail}</TooltipContent>
    </Tooltip>
  );
}
