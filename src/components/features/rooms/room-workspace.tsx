"use client";

import { MousePointerClick } from "lucide-react";

import { RoomActivity } from "@/components/features/rooms/room-activity";
import { RoomInspiration } from "@/components/features/rooms/room-inspiration";
import { RoomOverview } from "@/components/features/rooms/room-overview";
import { RoomPhotos } from "@/components/features/rooms/room-photos";
import { RoomSpecs } from "@/components/features/rooms/room-specs";
import { EmptyState } from "@/components/shared/EmptyState";
import { MoneyText } from "@/components/shared/MoneyText";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { percentLabel } from "@/lib/project-view";
import { can, type Actor } from "@/lib/rules";
import type { ChangeRequest, Room, SiteUpdate, User } from "@/types";

const TABS = ["overview", "specs", "photos", "inspiration", "activity"] as const;
export type RoomTab = (typeof TABS)[number];

export function isRoomTab(value: string | null): value is RoomTab {
  return TABS.some((tab) => tab === value);
}

export function RoomWorkspace({
  room,
  updates,
  requests,
  users,
  userId,
  actor,
  tab,
  onTab,
}: {
  room: Room | null;
  updates: SiteUpdate[];
  requests: ChangeRequest[];
  users: User[];
  userId: string;
  actor: Actor;
  tab: RoomTab;
  onTab: (tab: RoomTab) => void;
}) {
  if (!room) {
    return <EmptyState icon={MousePointerClick} title="Select a room" description="Specs, photos, and inspiration open here." />;
  }
  const canEdit = can(actor, "edit_room").allowed;
  const roomUpdates = updates.filter((update) => update.roomId === room.id);
  const roomRequests = requests.filter((request) => request.roomId === room.id);

  return (
    <div className="space-y-4 p-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl leading-8 font-semibold text-foreground">{room.name}</h2>
          <StatusBadge status={room.status} />
        </div>
        <ProgressBar value={room.progress} label={percentLabel(room.progress)} />
        <p className="text-sm text-muted-foreground">
          <MoneyText amount={room.budgetAllocation} compact /> allocated · {room.areaSqft} sqft · {room.activeTask}
        </p>
      </header>
      <Tabs value={tab} onValueChange={(value) => onTab(value as RoomTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="inspiration">Inspiration</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "overview" ? <RoomOverview room={room} updates={roomUpdates} requests={roomRequests} userId={userId} canEdit={canEdit} /> : null}
      {tab === "specs" ? <RoomSpecs room={room} userId={userId} actor={actor} /> : null}
      {tab === "photos" ? <RoomPhotos room={room} updates={roomUpdates} userId={userId} canEdit={canEdit} /> : null}
      {tab === "inspiration" ? <RoomInspiration room={room} users={users} userId={userId} canEdit={canEdit} /> : null}
      {tab === "activity" ? <RoomActivity room={room} updates={roomUpdates} requests={roomRequests} /> : null}
    </div>
  );
}
