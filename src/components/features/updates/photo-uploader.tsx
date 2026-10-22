"use client";

import { ImagePlus, X } from "lucide-react";
import { useState } from "react";

import { photosFromFiles, revokePhotos, type PhotoDraft } from "@/components/features/updates/post-update-schema";
import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PhotoUploader({
  photos,
  error,
  onChange,
}: {
  photos: PhotoDraft[];
  error?: string;
  onChange: (photos: PhotoDraft[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState("");

  function addFiles(list: FileList | File[]) {
    const images = photosFromFiles(list);
    if (images.length === 0) {
      setNote("Add an image file");
      return;
    }
    setNote("");
    onChange([...photos, ...images]);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Photos</p>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground",
          dragging && "border-primary bg-secondary",
        )}
      >
        <ImagePlus className="size-5" />
        Drop photos, or browse
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {note || error ? <p className="text-xs text-danger">{note || error}</p> : null}
      <ul className="space-y-3">
        {photos.map((photo, index) => (
          <li key={photo.url} className="flex gap-3 rounded-lg border border-border p-2">
            <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
              <SeedImage src={photo.url} alt="" sizes="80px" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <Input
                value={photo.caption}
                aria-label="Caption"
                placeholder="Caption"
                onChange={(event) => {
                  const next = photos.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, caption: event.target.value } : item,
                  );
                  onChange(next);
                }}
              />
              <select
                aria-label="Photo kind"
                value={photo.kind}
                onChange={(event) => {
                  const kind = event.target.value;
                  if (kind !== "before" && kind !== "progress" && kind !== "after") return;
                  onChange(photos.map((item, itemIndex) => (itemIndex === index ? { ...item, kind } : item)));
                }}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="before">Before</option>
                <option value="progress">Progress</option>
                <option value="after">After</option>
              </select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove photo"
              onClick={() => {
                revokePhotos([photo]);
                onChange(photos.filter((_, itemIndex) => itemIndex !== index));
              }}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
