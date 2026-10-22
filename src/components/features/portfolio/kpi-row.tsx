"use client";

import { StatCard } from "@/components/shared/StatCard";
import { formatINRCompact } from "@/lib/format";
import type { PortfolioKpis } from "@/lib/portfolio";
import type { Role } from "@/types";

export function KpiRow({ role, kpis }: { role: Role; kpis: PortfolioKpis }) {
  if (role === "designer") {
    return (
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active projects" value={kpis.activeProjects} />
        <StatCard label="Pending client approvals" value={kpis.pendingApprovals} />
        <StatCard label="Payments awaiting acknowledgement" value={kpis.awaitingAcknowledgement} formatValue={formatINRCompact} />
        <StatCard label="Projects at risk" value={kpis.projectsAtRisk} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard label="Active projects" value={kpis.activeProjects} />
      <StatCard label="Total budget" value={kpis.totalBudget} formatValue={formatINRCompact} />
      <StatCard label="Total paid" value={kpis.totalPaid} formatValue={formatINRCompact} />
      <StatCard label="Items needing your action" value={kpis.actionItems} />
    </div>
  );
}
