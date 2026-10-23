"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { MoneyText } from "@/components/shared/MoneyText";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { api } from "@/data/api";
import { committedSpend } from "@/lib/rooms";
import { changeRequestHref, percentLabel, updateHref } from "@/lib/project-view";
import type { ChangeRequest, Room, SiteUpdate } from "@/types";

export function RoomOverview({
  room,
  updates,
  requests,
  userId,
  canEdit,
}: {
  room: Room;
  updates: SiteUpdate[];
  requests: ChangeRequest[];
  userId: string;
  canEdit: boolean;
}) {
  const recent = [...updates].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 3);
  const openRequests = requests.filter((request) => request.status === "pending");
  const spend = committedSpend(room.specs);
  const width = room.budgetAllocation > 0 ? Math.min(100, (spend / room.budgetAllocation) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Progress</p>
        <div className="mt-2">
          <ProgressBar value={room.progress} label={percentLabel(room.progress)} />
        </div>
      </div>
      <TaskField key={`${room.id}:${room.activeTask}`} room={room} userId={userId} canEdit={canEdit} />
      <section>
        <h3 className="text-sm font-semibold text-foreground">Spend versus allocation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <MoneyText amount={spend} /> of <MoneyText amount={room.budgetAllocation} /> allocated
        </p>
        <div className="mt-2 h-2 rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Ordered and installed specs.</p>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Latest updates</h3>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">No updates for this room yet.</p> : null}
        {recent.map((update) => (
          <Link key={update.id} href={updateHref(room.projectId, update.id)} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
            <span className="truncate text-foreground">{update.title}</span>
            <StatusBadge status={update.status} />
          </Link>
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Open change requests</h3>
        {openRequests.length === 0 ? <p className="text-sm text-muted-foreground">Nothing waiting on a decision.</p> : null}
        {openRequests.map((request) => (
          <Link key={request.id} href={changeRequestHref(room.projectId, request.id)} className="block rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary">
            {request.title}
          </Link>
        ))}
      </section>
    </div>
  );
}

function TaskField({ room, userId, canEdit }: { room: Room; userId: string; canEdit: boolean }) {
  const [task, setTask] = useState(room.activeTask);

  async function saveTask() {
    if (!canEdit || task.trim() === room.activeTask) return;
    try {
      await api.updateActiveTask(userId, room.id, task);
      toast.success("Active task updated");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not update the task");
      setTask(room.activeTask);
    }
  }

  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">Active task</span>
      {canEdit ? (
        <Input value={task} onChange={(event) => setTask(event.target.value)} onBlur={() => void saveTask()} />
      ) : (
        <p className="text-sm text-foreground">{room.activeTask}</p>
      )}
    </label>
  );
}
