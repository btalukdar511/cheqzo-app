"use client";

import { useParams } from "next/navigation";

import { ActivityList } from "@/components/features/overview/activity-list";
import { BudgetPanel } from "@/components/features/overview/budget-panel";
import { OverviewAside } from "@/components/features/overview/overview-aside";
import { RoomGrid } from "@/components/features/overview/room-grid";
import { HealthBadge } from "@/components/shared/HealthBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { CardSkeleton } from "@/components/shared/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { overviewActions, percentLabel, personName, recentActivity } from "@/lib/project-view";
import { summarizeProject } from "@/lib/rules";

function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function OverviewScreen() {
  const params = useParams<{ projectId: string }>();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();

  if (!ready || !user) return <OverviewSkeleton />;

  const project = db.projects.find((item) => item.id === params.projectId);
  if (!project) return null;

  const rooms = db.rooms.filter((item) => item.projectId === project.id);
  const updates = db.updates.filter((item) => item.projectId === project.id);
  const payments = db.payments.filter((item) => item.projectId === project.id);
  const changeRequests = db.changeRequests.filter((item) => item.projectId === project.id);
  const team = db.teamMembers.filter((item) => item.projectId === project.id);
  const summary = summarizeProject({ project, rooms, updates, payments, changeRequests });
  const actions = overviewActions({ user, project, rooms, updates, payments, changeRequests });

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">{project.name}</h1>
          <HealthBadge health={summary.health} reasons={summary.reasons} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {project.location.area}, {project.location.city} · {project.bhk} {project.propertyType} · {project.areaSqft.toLocaleString("en-IN")} sqft
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {project.studioName} · {personName(db.users, project.designerId)}
        </p>
        <div className="mt-4 max-w-md">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span className="tabular-nums text-foreground">{percentLabel(summary.progress)}</span>
          </div>
          <ProgressBar value={summary.progress} />
        </div>
      </header>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <BudgetPanel project={project} summary={summary} />
          <RoomGrid projectId={project.id} rooms={rooms} updates={updates} />
          <ActivityList
            items={recentActivity({
              projectId: project.id,
              rooms,
              updates,
              payments,
              changeRequests,
            })}
          />
        </div>
        <div className="col-span-4">
          <OverviewAside
            project={project}
            payments={payments}
            team={team}
            users={db.users}
            badges={actions.badges}
            actions={actions.items}
            projectedEnd={summary.projectedEndDate}
          />
        </div>
      </div>
    </div>
  );
}
