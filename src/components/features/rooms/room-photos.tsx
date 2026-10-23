"use client";

import { useRef } from "react";
import { toast } from "sonner";

import { PhotoGrid } from "@/components/shared/PhotoGrid";
import { Button } from "@/components/ui/button";
import { api } from "@/data/api";
import { formatDate } from "@/lib/format";
import type { Room, SiteUpdate } from "@/types";

export function RoomPhotos({ room, updates, userId, canEdit }: { room: Room; updates: SiteUpdate[]; userId: string; canEdit: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const approved = updates
    .filter((update) => update.status === "approved")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      for (const file of files) {
        await api.addBeforePhoto(userId, room.id, URL.createObjectURL(file));
      }
      toast.success("Before photos added");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not add the photo");
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Before photos</h3>
          {canEdit ? (
            <>
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                Upload
              </Button>
              <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void upload(event.target.files)} />
            </>
          ) : null}
        </div>
        {room.beforePhotos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No before photos yet.</p>
        ) : (
          <PhotoGrid photos={room.beforePhotos.map((url, index) => ({ url, caption: `Before ${index + 1}`, kind: "before" as const }))} />
        )}
      </section>
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Progress timeline</h3>
        {approved.length === 0 ? <p className="text-sm text-muted-foreground">Approved update photos will show up here.</p> : null}
        {approved.map((update) => (
          <article key={update.id} className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {formatDate(update.createdAt)} · {update.title}
            </p>
            <PhotoGrid photos={update.photos} />
          </article>
        ))}
      </section>
    </div>
  );
}
