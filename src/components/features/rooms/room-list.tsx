"use client";

import { Plus, SearchX } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { MoneyText } from "@/components/shared/MoneyText";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SeedImage } from "@/components/shared/SeedImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { percentLabel } from "@/lib/project-view";
import type { RoomStatusFilter } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import type { Room } from "@/types";

export function RoomList({
  rooms,
  total,
  selectedId,
  search,
  status,
  canAdd,
  onSearch,
  onStatus,
  onSelect,
  onAdd,
  onClear,
}: {
  rooms: Room[];
  total: number;
  selectedId: string | null;
  search: string;
  status: RoomStatusFilter;
  canAdd: boolean;
  onSearch: (search: string) => void;
  onStatus: (status: RoomStatusFilter) => void;
  onSelect: (roomId: string) => void;
  onAdd: () => void;
  onClear: () => void;
}) {
  const filtered = search.trim().length > 0 || status !== "all";
  return (
    <div>
      <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-surface p-3">
        <div className="flex gap-2">
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search rooms" aria-label="Search rooms" />
          {canAdd ? (
            <Button type="button" size="icon" aria-label="Add room" onClick={onAdd}>
              <Plus />
            </Button>
          ) : null}
        </div>
        <Select value={status} onValueChange={(value) => onStatus(value as RoomStatusFilter)}>
          <SelectTrigger aria-label="Room status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not_started">Not started</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="awaiting_approval">Awaiting approval</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {total === 0 ? (
        <EmptyState icon={SearchX} title="No rooms yet" description="Add a room to track its specs, photos, and progress." />
      ) : rooms.length === 0 ? (
        <EmptyState icon={SearchX} title="No rooms match" description="Try another name or status." actionLabel={filtered ? "Clear filters" : undefined} onAction={onClear} />
      ) : (
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => onSelect(room.id)}
                className={cn("flex w-full gap-3 border-b border-border px-3 py-3 text-left hover:bg-secondary/70", selectedId === room.id && "bg-secondary")}
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {room.beforePhotos[0] ? <SeedImage src={room.beforePhotos[0]} alt="" sizes="56px" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{room.name}</span>
                    <StatusBadge status={room.status} />
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {room.areaSqft} sqft · <MoneyText amount={room.budgetAllocation} compact />
                  </span>
                  <span className="mt-2 block">
                    <ProgressBar value={room.progress} label={percentLabel(room.progress)} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{room.activeTask}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
