"use client";

import { Plus } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { ChangeDetail } from "@/components/features/changes/change-detail";
import { ChangeKpis } from "@/components/features/changes/change-kpis";
import { ChangeTable } from "@/components/features/changes/change-table";
import { RaiseChangeDialog } from "@/components/features/changes/raise-dialog";
import { SplitPane } from "@/components/shared/SplitPane";
import { CardSkeleton, SplitSkeleton } from "@/components/shared/Skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { changeKpis, isChangeStatusFilter, isRaisedByFilter, queryChanges } from "@/lib/changes";
import { actorFromUser, can } from "@/lib/rules";

export function ChangesScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const route = useParams<{ projectId: string }>();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();

  function writeParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (!ready || !user) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-4 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <SplitSkeleton />
      </div>
    );
  }

  const project = db.projects.find((item) => item.id === route.projectId);
  if (!project) return null;
  const requests = db.changeRequests.filter((item) => item.projectId === project.id);
  const rooms = db.rooms.filter((item) => item.projectId === project.id);
  const statusParam = params.get("status");
  const raisedByParam = params.get("by");
  const status = isChangeStatusFilter(statusParam) ? statusParam : "all";
  const raisedBy = isRaisedByFilter(raisedByParam) ? raisedByParam : "all";
  const visible = queryChanges(requests, { status, raisedBy });
  const selected = requests.find((item) => item.id === params.get("request")) ?? null;
  const actor = actorFromUser(user);
  const canRaise = can(actor, "raise_change_request").allowed;
  const filtered = status !== "all" || raisedBy !== "all";

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Change requests</h1>
        {canRaise ? (
          <Button type="button" onClick={() => writeParams({ raise: "1" })}>
            <Plus />
            Raise request
          </Button>
        ) : null}
      </header>
      <ChangeKpis kpis={changeKpis(requests)} />
      <SplitPane
        className="h-[36rem]"
        listClassName="w-[62%] min-w-[560px]"
        list={
          <ChangeTable
            requests={visible}
            rooms={rooms}
            users={db.users}
            status={status}
            raisedBy={raisedBy}
            selectedId={selected?.id ?? null}
            filtered={filtered}
            onStatus={(next) => writeParams({ status: next === "all" ? null : next })}
            onRaisedBy={(next) => writeParams({ by: next === "all" ? null : next })}
            onClear={() => writeParams({ status: null, by: null })}
            onSelect={(requestId) => writeParams({ request: requestId })}
          />
        }
        detail={
          <ChangeDetail
            request={selected}
            project={project}
            requests={db.changeRequests}
            rooms={rooms}
            users={db.users}
            userId={user.id}
            actor={actor}
          />
        }
      />
      {canRaise ? (
        <RaiseChangeDialog
          open={params.get("raise") === "1"}
          onOpenChange={(open) => {
            if (!open) writeParams({ raise: null });
          }}
          userId={user.id}
          projectId={project.id}
          rooms={rooms}
          onRaised={(requestId) => writeParams({ raise: null, request: requestId, status: null, by: null })}
        />
      ) : null}
    </div>
  );
}
