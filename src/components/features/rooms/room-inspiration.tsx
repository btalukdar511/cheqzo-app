"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/data/api";
import { personName } from "@/lib/project-view";
import type { Room, User } from "@/types";

export function RoomInspiration({
  room,
  users,
  userId,
  canEdit,
}: {
  room: Room;
  users: User[];
  userId: string;
  canEdit: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function addItem() {
    if (!file) {
      toast.error("Add an image");
      return;
    }
    try {
      await api.addInspiration(userId, room.id, { imageUrl: URL.createObjectURL(file), note, tag });
      toast.success("Inspiration added");
      setTag("");
      setNote("");
      setFile(null);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not add inspiration");
    }
  }

  async function comment(itemId: string) {
    const text = drafts[itemId] ?? "";
    try {
      await api.commentOnInspiration(userId, room.id, itemId, text);
      setDrafts((current) => ({ ...current, [itemId]: "" }));
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not add the comment");
    }
  }

  async function remove(itemId: string) {
    try {
      await api.removeInspiration(userId, room.id, itemId);
      toast.success("Inspiration removed");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not remove it");
    }
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div className="flex flex-wrap items-end gap-2">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            {file ? file.name : "Choose image"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <Input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="Tag" aria-label="Tag" className="max-w-32" />
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note" aria-label="Note" className="max-w-56" />
          <Button type="button" onClick={() => void addItem()}>
            Add
          </Button>
        </div>
      ) : null}
      {room.inspiration.length === 0 ? <p className="text-sm text-muted-foreground">No inspiration yet.</p> : null}
      <div className="columns-2 gap-3">
        {room.inspiration.map((item) => (
          <article key={item.id} className="mb-3 break-inside-avoid rounded-xl border border-border">
            <div className="relative aspect-[4/3]">
              <SeedImage src={item.imageUrl} alt={item.note || item.tag} sizes="320px" />
            </div>
            <div className="space-y-2 p-3">
              <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground">{item.tag}</span>
              {item.note ? <p className="text-sm text-foreground">{item.note}</p> : null}
              {canEdit ? (
                <button type="button" className="text-xs font-medium text-danger" onClick={() => void remove(item.id)}>
                  Remove
                </button>
              ) : null}
              <ul className="space-y-1">
                {item.comments.map((entry) => (
                  <li key={entry.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{personName(users, entry.authorId)}: </span>
                    {entry.text}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={drafts[item.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                  placeholder="Comment"
                  aria-label={`Comment on ${item.tag}`}
                />
                <Button type="button" variant="outline" onClick={() => void comment(item.id)}>
                  Send
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
