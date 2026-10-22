"use client";

import { Building2, Plus, SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { KpiRow } from "@/components/features/portfolio/kpi-row";
import { PortfolioToolbar } from "@/components/features/portfolio/portfolio-toolbar";
import { ProjectList } from "@/components/features/portfolio/project-list";
import { ProjectPreview } from "@/components/features/portfolio/project-preview";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton, SplitSkeleton } from "@/components/shared/Skeletons";
import { SplitPane } from "@/components/shared/SplitPane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { actorFromUser, can } from "@/lib/rules";
import {
  assemblePortfolio,
  portfolioKpis,
  queryPortfolio,
  type HealthFilter,
  type PortfolioSort,
} from "@/lib/portfolio";
import type { Health } from "@/types";
function isHealth(value: string | null): value is Health {
  return value === "on_track" || value === "needs_attention" || value === "at_risk";
}

function isSort(value: string | null): value is PortfolioSort {
  return value === "health" || value === "progress" || value === "deadline";
}

export function PortfolioScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();
  const [pickedId, setPickedId] = useState<string | null>(params.get("project"));

  const healthParam = params.get("health");
  const sortParam = params.get("sort");
  const health: HealthFilter = isHealth(healthParam) ? healthParam : "all";
  const sort: PortfolioSort = isSort(sortParam) ? sortParam : "health";
  const search = params.get("q") ?? "";
  const layout = params.get("view") === "grid" ? "grid" : "list";

  const items = useMemo(() => {
    if (!user) return [];
    return assemblePortfolio({
      user,
      projects: db.projects,
      rooms: db.rooms,
      updates: db.updates,
      payments: db.payments,
      changeRequests: db.changeRequests,
      teamMembers: db.teamMembers,
      users: db.users,
    });
  }, [db, user]);

  const visible = useMemo(
    () => queryPortfolio(items, { search, health, sort }),
    [items, search, health, sort],
  );
  const kpis = useMemo(() => portfolioKpis(items), [items]);
  const selected = visible.find((item) => item.project.id === pickedId) ?? visible[0] ?? null;
  const canCreate = user ? can(actorFromUser(user), "create_project").allowed : false;

  function writeParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function openProject(id: string) {
    router.push(`/projects/${id}`);
  }

  if (!ready || !user) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <SplitSkeleton />
      </div>
    );
  }

  const title = user.role === "designer" ? "Studio portfolio" : "Your projects";
  const list = (
    <div>
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Input
          value={search}
          aria-label="Search projects"
          placeholder="Search projects"
          onChange={(event) => writeParams({ q: event.target.value || null })}
        />
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No projects match"
          description="Try another filter or clear the search."
          actionLabel="Clear filters"
          onAction={() => {
            setPickedId(null);
            writeParams({ q: null, health: null, sort: null });
          }}
        />
      ) : (
        <ProjectList
          items={visible}
          selectedId={selected?.project.id ?? null}
          layout={layout}
          onSelect={setPickedId}
          onOpen={openProject}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">{title}</h1>
        {canCreate ? (
          <Button onClick={() => router.push("/projects/new")}>
            <Plus />
            New project
          </Button>
        ) : null}
      </header>
      <KpiRow role={user.role} kpis={kpis} />
      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Building2}
            title="No projects yet"
            description={canCreate ? "Create a project to start the studio portfolio." : "Projects you are part of will show up here."}
            actionLabel={canCreate ? "New project" : undefined}
            onAction={canCreate ? () => router.push("/projects/new") : undefined}
          />
        </div>
      ) : (
        <>
          <PortfolioToolbar
            health={health}
            sort={sort}
            layout={layout}
            onHealth={(next) => writeParams({ health: next === "all" ? null : next })}
            onSort={(next) => writeParams({ sort: next === "health" ? null : next })}
            onLayout={(next) => writeParams({ view: next === "list" ? null : "grid" })}
          />
          {layout === "list" ? (
            <SplitPane
              className="h-[36rem]"
              list={list}
              detail={
                selected ? (
                  <ProjectPreview item={selected} onOpen={openProject} />
                ) : (
                  <p className="p-6 text-sm text-muted-foreground">No project selected.</p>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-[1fr_380px] gap-4">
              <div className="rounded-xl border border-border bg-surface">{list}</div>
              <div className="rounded-xl border border-border bg-surface">
                {selected ? <ProjectPreview item={selected} onOpen={openProject} /> : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
