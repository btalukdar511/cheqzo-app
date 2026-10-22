"use client";

import { CountUp } from "@/components/shared/CountUp";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  formatValue?: (value: number) => string;
  subline?: string;
  delta?: { label: string; tone: "positive" | "negative" | "neutral" };
  className?: string;
}

const DELTA_TONE = {
  positive: "bg-success/10 text-success",
  negative: "bg-danger/10 text-danger",
  neutral: "bg-secondary text-muted-foreground",
};

export function StatCard({ label, value, formatValue, subline, delta, className }: StatCardProps) {
  return (
    <article className={cn("rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]", className)}>
      <p className="text-xs leading-4 text-muted-foreground">{label}</p>
      <CountUp
        value={value}
        format={formatValue}
        className="mt-2 block font-display text-[32px] leading-[40px] font-semibold text-foreground"
      />
      <div className="mt-2 flex items-center gap-2">
        {delta ? (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", DELTA_TONE[delta.tone])}>{delta.label}</span>
        ) : null}
        {subline ? <p className="text-xs leading-4 text-muted-foreground">{subline}</p> : null}
      </div>
    </article>
  );
}
