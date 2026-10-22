import { z } from "zod";

import type { Room } from "@/types";

export const PHOTO_KINDS = ["before", "progress", "after"] as const;

const photoSchema = z.object({
  url: z.string().min(1),
  caption: z.string(),
  kind: z.enum(PHOTO_KINDS),
});

export interface PhotoDraft {
  url: string;
  caption: string;
  kind: (typeof PHOTO_KINDS)[number];
}

export interface PostFormValues {
  roomId: string;
  title: string;
  description: string;
  proposedProgress: number;
  notifyClient: boolean;
  photos: PhotoDraft[];
}

export function blankPost(rooms: Room[]): PostFormValues {
  const room = rooms[0];
  return {
    roomId: room?.id ?? "",
    title: "",
    description: "",
    proposedProgress: room?.progress ?? 0,
    notifyClient: true,
    photos: [],
  };
}

export function postUpdateSchema(lookup: () => Room[]) {
  return z
    .object({
      roomId: z.string().min(1, "Choose a room"),
      title: z.string().refine((value) => value.trim().length > 0, "Enter a title"),
      description: z.string(),
      proposedProgress: z.number().min(0).max(100),
      notifyClient: z.boolean(),
      photos: z.array(photoSchema).min(1, "Add at least one photo"),
    })
    .refine(
      (value) => {
        const room = lookup().find((item) => item.id === value.roomId);
        return Boolean(room && value.proposedProgress >= room.progress);
      },
      { path: ["proposedProgress"], message: "Proposed progress has to be at least the current progress" },
    );
}

export function revokePhotos(photos: PhotoDraft[]) {
  for (const photo of photos) {
    if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);
  }
}

export function photosFromFiles(list: FileList | File[]): PhotoDraft[] {
  return Array.from(list)
    .filter((file) => file.type.startsWith("image/"))
    .map((file) => ({
      url: URL.createObjectURL(file),
      caption: "",
      kind: "progress" as const,
    }));
}
