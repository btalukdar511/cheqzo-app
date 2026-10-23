import type { ChangeRequest, MaterialSpec, Room, SiteUpdate } from "@/types";

export const SPEC_CATEGORIES: MaterialSpec["category"][] = [
  "Flooring",
  "Walls",
  "Ceiling",
  "Furniture",
  "Lighting",
  "Fixtures",
  "Hardware",
];

export type RoomStatusFilter = "all" | Room["status"];

export function isRoomStatusFilter(value: string | null): value is RoomStatusFilter {
  return value === "all" || value === "not_started" || value === "in_progress" || value === "awaiting_approval" || value === "completed";
}

export function queryRooms(rooms: Room[], filter: { search: string; status: RoomStatusFilter }): Room[] {
  const search = filter.search.trim().toLowerCase();
  return rooms.filter((room) => {
    if (filter.status !== "all" && room.status !== filter.status) return false;
    if (!search) return true;
    return room.name.toLowerCase().includes(search) || room.activeTask.toLowerCase().includes(search);
  });
}

export function specTotal(specs: MaterialSpec[]): number {
  return specs.reduce((total, spec) => total + spec.estCost, 0);
}

export function committedSpend(specs: MaterialSpec[]): number {
  return specs
    .filter((spec) => spec.status === "ordered" || spec.status === "installed")
    .reduce((total, spec) => total + spec.estCost, 0);
}

export interface SpecGroup {
  category: MaterialSpec["category"];
  items: MaterialSpec[];
  subtotal: number;
}

export function specGroups(specs: MaterialSpec[]): SpecGroup[] {
  return SPEC_CATEGORIES.flatMap((category) => {
    const items = specs.filter((spec) => spec.category === category);
    if (items.length === 0) return [];
    return [{ category, items, subtotal: specTotal(items) }];
  });
}

export function overAllocation(total: number, allocation: number): number {
  return Math.max(0, total - allocation);
}

export interface RoomEvent {
  id: string;
  at: string;
  title: string;
  detail: string;
}

const UPDATE_STATUS: Record<SiteUpdate["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

const CHANGE_STATUS: Record<ChangeRequest["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function roomActivity(input: {
  roomId: string;
  updates: SiteUpdate[];
  changeRequests: ChangeRequest[];
}): RoomEvent[] {
  const updates = input.updates
    .filter((item) => item.roomId === input.roomId)
    .map((item) => ({
      id: item.id,
      at: item.createdAt,
      title: item.title,
      detail: `Update · ${UPDATE_STATUS[item.status]}`,
    }));
  const changes = input.changeRequests
    .filter((item) => item.roomId === input.roomId)
    .map((item) => ({
      id: item.id,
      at: item.createdAt,
      title: item.title,
      detail: `Change request · ${CHANGE_STATUS[item.status]}`,
    }));
  return [...updates, ...changes].sort((left, right) => left.at.localeCompare(right.at));
}
