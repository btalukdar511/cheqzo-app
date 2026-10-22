"use client";

import { useState } from "react";

import { Lightbox, type GalleryPhoto } from "@/components/shared/Lightbox";
import { SeedImage } from "@/components/shared/SeedImage";
import { cn } from "@/lib/utils";

export type { GalleryPhoto };

interface PhotoGridProps {
  photos: GalleryPhoto[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <button
            key={`${photo.url}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-[3/2] overflow-hidden rounded-lg"
          >
            <SeedImage
              src={photo.url}
              alt={photo.caption || "Project photo"}
              className="transition-transform duration-200 group-hover:scale-105"
            />
            {photo.kind ? (
              <span className={cn("absolute bottom-2 left-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] text-background")}>
                {photo.kind}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {openIndex !== null ? (
        <Lightbox photos={photos} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      ) : null}
    </>
  );
}
