import { StatCard } from "@/components/shared/StatCard";
import { TimelineCompare } from "@/components/shared/TimelineCompare";
import { BudgetDonut } from "@/components/features/overview/budget-donut";
import { formatDate, formatINRCompact } from "@/lib/format";
import { budgetSlices } from "@/lib/project-view";
import type { ProjectSummary } from "@/lib/rules";
import type { Project } from "@/types";

export function BudgetPanel({ project, summary }: { project: Project; summary: ProjectSummary }) {
  const awaiting =
    summary.awaitingAcknowledgement > 0
      ? `${formatINRCompact(summary.awaitingAcknowledgement)} awaiting acknowledgement`
      : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-3">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Estimated cost" value={summary.estimatedCost} formatValue={formatINRCompact} />
          <StatCard label="Total paid" value={summary.totalPaid} formatValue={formatINRCompact} subline={awaiting} />
          <StatCard label="Remaining balance" value={summary.remaining} formatValue={formatINRCompact} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <BudgetDonut slices={budgetSlices(summary)} />
        </div>
      </div>
      <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-base leading-6 font-semibold text-foreground">Timeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Original {formatDate(project.originalEndDate)} → Projected {formatDate(summary.projectedEndDate)}
        </p>
        <div className="mt-4">
          <TimelineCompare
            startDate={project.startDate}
            originalEnd={project.originalEndDate}
            projectedEnd={summary.projectedEndDate}
          />
        </div>
      </section>
    </div>
  );
}
