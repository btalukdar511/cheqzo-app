"use client";

import { formatDate, relativeTime } from "@/lib/format";
import { roomActivity } from "@/lib/rooms";
import type { ChangeRequest, Room, SiteUpdate } from "@/types";

export function RoomActivity({ room, updates, requests }: { room: Room; updates: SiteUpdate[]; requests: ChangeRequest[] }) {
  const events = roomActivity({ roomId: room.id, updates, changeRequests: requests });
  if (events.length === 0) return <p className="text-sm text-muted-foreground">Nothing has been recorded for this room yet.</p>;
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="border-l-2 border-border pl-3">
          <p className="text-sm font-medium text-foreground">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {event.detail} · {formatDate(event.at)} · {relativeTime(event.at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
