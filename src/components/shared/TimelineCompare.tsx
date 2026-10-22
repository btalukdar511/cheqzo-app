import { differenceInCalendarDays, parseISO } from "date-fns";

import { formatDate } from "@/lib/format";

interface TimelineCompareProps {
  startDate: string;
  originalEnd: string;
  projectedEnd: string;
}

export function TimelineCompare({ startDate, originalEnd, projectedEnd }: TimelineCompareProps) {
  const start = parseISO(startDate);
  const original = parseISO(originalEnd);
  const projected = parseISO(projectedEnd);
  const span = Math.max(differenceInCalendarDays(projected, start), differenceInCalendarDays(original, start), 1);
  const originalWidth = Math.min(100, (differenceInCalendarDays(original, start) / span) * 100);
  const projectedWidth = Math.min(100, (differenceInCalendarDays(projected, start) / span) * 100);
  const delay = differenceInCalendarDays(projected, original);
  const chip = delay > 0 ? `+${delay} days` : delay < 0 ? `${delay} days` : "On time";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-4 text-muted-foreground">Original vs projected</p>
        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">{chip}</span>
      </div>
      <Bar label={`Original ${formatDate(originalEnd)}`} width={originalWidth} className="bg-secondary" />
      <Bar label={`Projected ${formatDate(projectedEnd)}`} width={projectedWidth} className="bg-primary" />
    </div>
  );
}

function Bar({ label, width, className }: { label: string; width: number; className: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs leading-4 text-foreground">{label}</p>
      <div className="h-2 rounded-full bg-secondary/70">
        <div className={`h-2 rounded-full ${className}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
