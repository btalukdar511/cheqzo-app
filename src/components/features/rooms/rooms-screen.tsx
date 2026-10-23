"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { AddRoomDialog } from "@/components/features/rooms/add-room-dialog";
import { RoomList } from "@/components/features/rooms/room-list";
import { isRoomTab, RoomWorkspace } from "@/components/features/rooms/room-workspace";
import { SplitPane } from "@/components/shared/SplitPane";
import { SplitSkeleton } from "@/components/shared/Skeletons";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { isRoomStatusFilter, queryRooms } from "@/lib/rooms";
import { actorFromUser, can } from "@/lib/rules";

export function RoomsScreen() {
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

  const projectId = route.projectId;
  const rooms = db.rooms.filter((room) => room.projectId === projectId);
  const roomKey = rooms.map((room) => room.id).join(",");
  const requested = params.get("room");

  useEffect(() => {
    if (!ready || rooms.length === 0) return;
    if (requested && rooms.some((room) => room.id === requested)) return;
    writeParams({ room: rooms[0]?.id ?? null });
    // writeParams closes over the latest search params. Re-run when the room set or selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, roomKey, requested]);

  if (!ready || !user) return <SplitSkeleton />;
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) return null;

  const statusParam = params.get("status");
  const tabParam = params.get("tab");
  const status = isRoomStatusFilter(statusParam) ? statusParam : "all";
  const search = params.get("q") ?? "";
  const visible = queryRooms(rooms, { search, status });
  const selected = rooms.find((room) => room.id === requested) ?? null;
  const actor = actorFromUser(user);
  const canEdit = can(actor, "edit_room").allowed;
  const tab = isRoomTab(tabParam) ? tabParam : "overview";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Rooms</h1>
      <SplitPane
        className="h-[40rem]"
        list={
          <RoomList
            rooms={visible}
            total={rooms.length}
            selectedId={selected?.id ?? null}
            search={search}
            status={status}
            canAdd={canEdit}
            onSearch={(value) => writeParams({ q: value || null })}
            onStatus={(value) => writeParams({ status: value === "all" ? null : value })}
            onSelect={(roomId) => writeParams({ room: roomId })}
            onAdd={() => writeParams({ add: "1" })}
            onClear={() => writeParams({ q: null, status: null })}
          />
        }
        detail={
          <RoomWorkspace
            room={selected}
            updates={db.updates.filter((update) => update.projectId === project.id)}
            requests={db.changeRequests.filter((request) => request.projectId === project.id)}
            users={db.users}
            userId={user.id}
            actor={actor}
            tab={tab}
            onTab={(next) => writeParams({ tab: next === "overview" ? null : next })}
          />
        }
      />
      {canEdit ? (
        <AddRoomDialog
          open={params.get("add") === "1"}
          onOpenChange={(open) => {
            if (!open) writeParams({ add: null });
          }}
          userId={user.id}
          projectId={project.id}
          onAdded={(roomId) => writeParams({ add: null, room: roomId })}
        />
      ) : null}
    </div>
  );
}
