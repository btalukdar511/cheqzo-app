import { CommentThread } from "@/components/features/updates/comment-thread";
import { DecisionPanel } from "@/components/features/updates/decision-panel";
import { PhotoGrid } from "@/components/shared/PhotoGrid";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, relativeTime } from "@/lib/format";
import { personName } from "@/lib/project-view";
import type { Actor } from "@/lib/rules";
import type { Room, SiteUpdate, User } from "@/types";

export function UpdateDetail({
  update,
  room,
  users,
  userId,
  actor,
}: {
  update: SiteUpdate;
  room: Room;
  users: User[];
  userId: string;
  actor: Actor;
}) {
  return (
    <article className="space-y-6 p-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-primary">{room.name}</p>
          <StatusBadge status={update.status} />
        </div>
        <h2 className="mt-1 font-display text-2xl leading-8 font-semibold text-foreground">{update.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {personName(users, update.authorId)} · {relativeTime(update.createdAt)} · {formatDate(update.createdAt)}
        </p>
      </header>
      {update.description ? <p className="text-sm leading-5 text-foreground">{update.description}</p> : null}
      <PhotoGrid photos={update.photos} />
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Progress</h3>
        <ProgressBar
          value={room.progress}
          proposed={update.status === "pending" ? update.proposedProgress : undefined}
          label={`${update.previousProgress}% → ${update.proposedProgress}%`}
        />
      </section>
      <DecisionPanel key={`decision-${update.id}`} update={update} roomName={room.name} users={users} userId={userId} actor={actor} />
      <CommentThread key={`thread-${update.id}`} update={update} users={users} userId={userId} />
    </article>
  );
}
