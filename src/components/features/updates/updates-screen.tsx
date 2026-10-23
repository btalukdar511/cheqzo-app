"use client";

import { ImagePlus, Plus, SearchX, Images, MousePointerClick } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PostUpdateSheet } from "@/components/features/updates/post-update-sheet";
import { UpdateDetail } from "@/components/features/updates/update-detail";
import { UpdateFeed } from "@/components/features/updates/update-feed";
import { EmptyState } from "@/components/shared/EmptyState";
import { SplitPane } from "@/components/shared/SplitPane";
import { SplitSkeleton } from "@/components/shared/Skeletons";
import { DisabledHint } from "@/components/shell/DisabledHint";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import {
  groupUpdates,
  isUpdateSort,
  isUpdateStatusFilter,
  queryUpdates,
  type UpdateSort,
  type UpdateStatusFilter,
} from "@/lib/project-view";
import { actorFromUser, can } from "@/lib/rules";
import { cn } from "@/lib/utils";

const FILTERS: { id: UpdateStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "changes_requested", label: "Changes Requested" },
  { id: "rejected", label: "Rejected" },
];

export function UpdatesScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const route = useParams<{ projectId: string }>();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();
  const [postOpen, setPostOpen] = useState(false);
  const projectId = route.projectId;

  function writeParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (!ready || !user) return <SplitSkeleton />;

  const project = db.projects.find((item) => item.id === projectId);
  if (!project) return null;

  const rooms = db.rooms.filter((item) => item.projectId === project.id);
  const updates = db.updates.filter((item) => item.projectId === project.id);
  const statusParam = params.get("status");
  const sortParam = params.get("sort");
  const roomParam = params.get("room");
  const status: UpdateStatusFilter = isUpdateStatusFilter(statusParam) ? statusParam : "all";
  const sort: UpdateSort = isUpdateSort(sortParam) ? sortParam : "newest";
  const roomId = rooms.some((room) => room.id === roomParam) ? roomParam : null;
  const visible = queryUpdates(updates, { status, roomId, sort });
  const selected = visible.find((item) => item.id === params.get("update")) ?? null;
  const room = selected ? rooms.find((item) => item.id === selected.roomId) : undefined;
  const canPost = can(actorFromUser(user), "post_update").allowed;
  const filtersOn = status !== "all" || roomId !== null || sort !== "newest";

  const list = (
    <div>
      <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-surface p-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={status === filter.id}
              onClick={() => writeParams({ status: filter.id === "all" ? null : filter.id })}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                status === filter.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={roomId ?? "all"} onValueChange={(value) => writeParams({ room: value === "all" ? null : value })}>
            <SelectTrigger aria-label="Room" className="w-full">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              {rooms.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => writeParams({ sort: value === "newest" ? null : value })}>
            <SelectTrigger aria-label="Sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {updates.length === 0 ? (
        <EmptyState icon={Images} title="No updates yet" description="Site progress will show up here once it is posted." />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No updates match"
          description="Try another status or room."
          actionLabel={filtersOn ? "Clear filters" : undefined}
          onAction={filtersOn ? () => writeParams({ status: null, room: null, sort: null }) : undefined}
        />
      ) : (
        <UpdateFeed
          groups={groupUpdates(visible)}
          rooms={rooms}
          users={db.users}
          selectedId={selected?.id ?? null}
          onSelect={(id) => writeParams({ update: id })}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Updates</h1>
        {canPost ? (
          <DisabledHint disabled={rooms.length === 0} reason="Add a room before posting an update">
            <Button onClick={() => setPostOpen(true)} disabled={rooms.length === 0}>
              <Plus />
              Post update
            </Button>
          </DisabledHint>
        ) : null}
      </header>
      <SplitPane
        className="h-[calc(100vh-11rem)]"
        list={list}
        detail={
          selected && room ? (
            <UpdateDetail update={selected} room={room} users={db.users} userId={user.id} actor={actorFromUser(user)} />
          ) : (
            <EmptyState
              icon={updates.length === 0 ? ImagePlus : MousePointerClick}
              title="Select an update to review"
              description="Photos, the progress change, and the decision show up here."
            />
          )
        }
      />
      {canPost ? (
        <PostUpdateSheet
          key={project.id}
          open={postOpen}
          onOpenChange={setPostOpen}
          userId={user.id}
          projectId={project.id}
          rooms={rooms}
          onPosted={(id) => writeParams({ update: id, status: null, room: null, sort: null })}
        />
      ) : null}
    </div>
  );
}
