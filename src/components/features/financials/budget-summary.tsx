import { BudgetDonut } from "@/components/features/overview/budget-donut";
import { StatCard } from "@/components/shared/StatCard";
import { financialSlices } from "@/lib/financials";
import { formatINRCompact } from "@/lib/format";
import type { ProjectSummary } from "@/lib/rules";

export function BudgetSummary({
  summary,
  chip,
}: {
  summary: ProjectSummary;
  chip: { label: string; tone: "neutral" } | null;
}) {
  const awaiting =
    summary.awaitingAcknowledgement > 0
      ? `${formatINRCompact(summary.awaitingAcknowledgement)} awaiting acknowledgement`
      : undefined;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Estimated cost" value={summary.estimatedCost} formatValue={formatINRCompact} delta={chip ?? undefined} />
        <StatCard label="Total paid" value={summary.totalPaid} formatValue={formatINRCompact} subline={awaiting} />
        <StatCard label="Remaining balance" value={summary.remaining} formatValue={formatINRCompact} />
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <BudgetDonut slices={financialSlices(summary)} />
      </div>
    </div>
  );
}
