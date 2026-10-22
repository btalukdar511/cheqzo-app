import { SeedImage } from "@/components/shared/SeedImage";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { relativeTime } from "@/lib/format";
import { personName, roomName, type UpdateGroup } from "@/lib/project-view";
import { cn } from "@/lib/utils";
import type { Room, SiteUpdate, User } from "@/types";

export function UpdateFeed({
  groups,
  rooms,
  users,
  selectedId,
  onSelect,
}: {
  groups: UpdateGroup[];
  rooms: Room[];
  users: User[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="px-3 pt-3 text-xs font-medium text-muted-foreground">{group.label}</h2>
          <ul>
            {group.items.map((update) => (
              <li key={update.id}>
                <UpdateCard
                  update={update}
                  room={roomName(rooms, update.roomId)}
                  author={personName(users, update.authorId)}
                  selected={update.id === selectedId}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function UpdateCard({
  update,
  room,
  author,
  selected,
  onSelect,
}: {
  update: SiteUpdate;
  room: string;
  author: string;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(update.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "w-full border-b border-border px-3 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "bg-secondary" : "hover:bg-secondary/60",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-primary">{room}</span>
        <StatusBadge status={update.status} />
      </span>
      <span className="mt-1 block text-sm font-medium text-foreground">{update.title}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {author} · {relativeTime(update.createdAt)}
      </span>
      {update.photos.length > 0 ? (
        <span className="mt-2 flex gap-1">
          {update.photos.slice(0, 3).map((photo, index) => (
            <span key={`${photo.url}-${index}`} className="relative h-12 w-16 overflow-hidden rounded-md">
              <SeedImage src={photo.url} alt="" sizes="64px" />
            </span>
          ))}
        </span>
      ) : null}
      <span className="mt-2 inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-foreground">
        {update.previousProgress}% → {update.proposedProgress}%
      </span>
    </button>
  );
}
