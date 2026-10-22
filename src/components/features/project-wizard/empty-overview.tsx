"use client";

import { ImageIcon, IndianRupee, LayoutGrid } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { MoneyText } from "@/components/shared/MoneyText";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { summarizeProject } from "@/lib/rules";
import type { Project, Room } from "@/types";

export function EmptyProjectOverview({ project, rooms }: { project: Project; rooms: Room[] }) {
  const summary = summarizeProject({
    project,
    rooms,
    updates: [],
    payments: [],
    changeRequests: [],
  });

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">{project.name}</h1>
          <HealthBadge health={summary.health} reasons={summary.reasons} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {project.location.area}, {project.location.city} · {project.bhk} {project.propertyType} · {project.areaSqft.toLocaleString("en-IN")} sqft
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimated <MoneyText amount={summary.estimatedCost} compact /> · nothing paid yet
        </p>
      </header>
      {rooms.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No rooms yet"
          description="Rooms added in the wizard show up here with their area and budget."
        />
      ) : (
        <section>
          <h2 className="text-base leading-6 font-semibold text-foreground">Rooms</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {rooms.map((room) => (
              <li key={room.id} className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{room.name}</p>
                  <p className="text-xs text-muted-foreground">{room.areaSqft.toLocaleString("en-IN")} sqft</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <MoneyText amount={room.budgetAllocation} compact /> allocated · {room.activeTask}
                </p>
                <div className="mt-3">
                  <ProgressBar value={room.progress} label="0%" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState icon={ImageIcon} title="No updates yet" description="Site updates will show up here once they are posted." />
        </div>
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState icon={IndianRupee} title="No payments yet" description="Recorded payments and acknowledgements will show up here." />
        </div>
      </div>
    </div>
  );
}
