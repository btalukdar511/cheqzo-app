"use client";

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { DisabledHint } from "@/components/shell/DisabledHint";
import { MoneyText } from "@/components/shared/MoneyText";
import { ROOM_PRESETS, ROOM_TYPES, type DraftRoom, type ProjectDraft } from "@/components/features/project-wizard/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allocationStatus } from "@/lib/rules";
import type { Room } from "@/types";
import { cn } from "@/lib/utils";

function money(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function RoomsStep({
  draft,
  errors,
  onChange,
}: {
  draft: ProjectDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<ProjectDraft>) => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<Room["type"]>("living");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const status = allocationStatus(
    draft.rooms.map((room) => money(room.budgetAllocation)),
    money(draft.budget),
  );

  function setRooms(rooms: DraftRoom[]) {
    onChange({ rooms });
  }

  function addRoom(name: string, type: Room["type"]) {
    setRooms([
      ...draft.rooms,
      { key: crypto.randomUUID(), name, type, areaSqft: "", budgetAllocation: "" },
    ]);
  }

  function updateRoom(key: string, patch: Partial<DraftRoom>) {
    setRooms(draft.rooms.map((room) => (room.key === key ? { ...room, ...patch } : room)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.rooms.length) return;
    const next = [...draft.rooms];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setRooms(next);
  }

  function dropOn(targetKey: string) {
    if (!dragKey || dragKey === targetKey) return;
    const next = [...draft.rooms];
    const from = next.findIndex((room) => room.key === dragKey);
    const to = next.findIndex((room) => room.key === targetKey);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setRooms(next);
    setDragKey(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ROOM_PRESETS.map((preset) => {
          const taken = draft.rooms.some((room) => room.name === preset.name);
          return (
            <DisabledHint key={preset.name} disabled={taken} reason="Already added">
              <Button type="button" variant="outline" size="sm" disabled={taken} onClick={() => addRoom(preset.name, preset.type)}>
                <Plus />
                {preset.name}
              </Button>
            </DisabledHint>
          );
        })}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="custom-room" className="text-sm font-medium text-foreground">
            Custom room
          </label>
          <Input id="custom-room" className="mt-1.5 h-10" value={customName} onChange={(event) => setCustomName(event.target.value)} />
        </div>
        <Select value={customType} onValueChange={(value) => setCustomType(value as Room["type"])}>
          <SelectTrigger className="w-36" aria-label="Custom room type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DisabledHint disabled={!customName.trim()} reason="Name the room first">
          <Button
            type="button"
            variant="outline"
            disabled={!customName.trim()}
            onClick={() => {
              addRoom(customName.trim(), customType);
              setCustomName("");
            }}
          >
            Add
          </Button>
        </DisabledHint>
      </div>
      <ul className="space-y-2">
        {draft.rooms.map((room, index) => (
          <li
            key={room.key}
            draggable
            onDragStart={() => setDragKey(room.key)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(room.key)}
            className={cn("grid grid-cols-[auto_1fr_7rem_8rem_auto] items-start gap-2 rounded-lg border border-border p-2", dragKey === room.key && "opacity-60")}
          >
            <span className="mt-2 text-muted-foreground" aria-hidden>
              <GripVertical className="size-4" />
            </span>
            <div>
              <Input aria-label={`${room.name || "Room"} name`} value={room.name} onChange={(event) => updateRoom(room.key, { name: event.target.value })} />
              {errors[`room-${index}-name`] ? <p className="mt-1 text-xs text-danger">{errors[`room-${index}-name`]}</p> : null}
            </div>
            <div>
              <Input aria-label={`${room.name || "Room"} area`} inputMode="numeric" placeholder="sqft" value={room.areaSqft} onChange={(event) => updateRoom(room.key, { areaSqft: event.target.value })} />
              {errors[`room-${index}-area`] ? <p className="mt-1 text-xs text-danger">{errors[`room-${index}-area`]}</p> : null}
            </div>
            <div>
              <Input aria-label={`${room.name || "Room"} budget`} inputMode="numeric" placeholder="₹" value={room.budgetAllocation} onChange={(event) => updateRoom(room.key, { budgetAllocation: event.target.value })} />
              {errors[`room-${index}-budget`] ? <p className="mt-1 text-xs text-danger">{errors[`room-${index}-budget`]}</p> : null}
            </div>
            <div className="flex gap-1">
              <DisabledHint disabled={index === 0} reason="Already first">
                <Button type="button" variant="ghost" size="icon" aria-label={`Move ${room.name || "room"} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ChevronUp />
                </Button>
              </DisabledHint>
              <DisabledHint disabled={index === draft.rooms.length - 1} reason="Already last">
                <Button type="button" variant="ghost" size="icon" aria-label={`Move ${room.name || "room"} down`} disabled={index === draft.rooms.length - 1} onClick={() => move(index, 1)}>
                  <ChevronDown />
                </Button>
              </DisabledHint>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${room.name || "room"}`} onClick={() => setRooms(draft.rooms.filter((item) => item.key !== room.key))}>
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-lg bg-secondary px-3 py-2 text-sm">
        <p>
          Allocated <MoneyText amount={status.allocated} compact />
          {status.budgetSet ? (
            <>
              {" "}
              · Remaining to allocate <MoneyText amount={status.remaining} compact />
            </>
          ) : null}
        </p>
        {status.budgetSet && !status.matches ? (
          <p className="mt-1 text-xs text-warning">Allocation does not match the project budget. You can still continue.</p>
        ) : null}
        {!status.budgetSet ? (
          <p className="mt-1 text-xs text-muted-foreground">The project budget is set in the next step.</p>
        ) : null}
      </div>
    </div>
  );
}
