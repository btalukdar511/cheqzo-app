import { ImageIcon, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/EmptyState";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { SeedImage } from "@/components/shared/SeedImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { pendingProposal } from "@/lib/rules";
import { percentLabel } from "@/lib/project-view";
import type { Room, SiteUpdate } from "@/types";

export function RoomGrid({ projectId, rooms, updates }: { projectId: string; rooms: Room[]; updates: SiteUpdate[] }) {
  if (rooms.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface">
        <EmptyState icon={LayoutGrid} title="No rooms yet" description="Rooms from the project setup show up here with their progress." />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-base leading-6 font-semibold text-foreground">Rooms</h2>
      <ul className="mt-3 grid grid-cols-3 gap-3">
        {rooms.map((room) => {
          const photo = room.beforePhotos[0];
          const proposed = pendingProposal(room.id, updates);
          return (
            <li key={room.id}>
              <Link
                href={`/projects/${projectId}/rooms?room=${room.id}`}
                className="hover-lift block overflow-hidden rounded-xl border border-border bg-surface outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="relative aspect-[3/2] bg-secondary">
                  {photo ? (
                    <SeedImage src={photo} alt="" sizes="240px" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{room.name}</p>
                    <StatusBadge status={room.status} />
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{room.activeTask}</p>
                  <ProgressBar value={room.progress} proposed={proposed} label={percentLabel(room.progress)} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
