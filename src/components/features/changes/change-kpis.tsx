"use client";

import { StatCard } from "@/components/shared/StatCard";
import { signedCompact, signedDays, type ChangeKpis } from "@/lib/changes";
import { formatDate } from "@/lib/format";

export function ChangeKpis({ kpis }: { kpis: ChangeKpis }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <StatCard label="Pending requests" value={kpis.pending} formatValue={(value) => String(Math.round(value))} />
      <StatCard label="Net cost impact" value={kpis.netCost} formatValue={signedCompact} subline="Approved" />
      <StatCard label="Net days impact" value={kpis.netDays} formatValue={signedDays} subline="Approved" />
      <article className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <p className="text-xs leading-4 text-muted-foreground">Next decision due</p>
        <p className="mt-2 font-display text-[28px] leading-9 font-semibold text-foreground">
          {kpis.nextDue ? formatDate(kpis.nextDue) : "None"}
        </p>
        <p className="mt-2 text-xs leading-4 text-muted-foreground">Oldest pending request</p>
      </article>
    </div>
  );
}
