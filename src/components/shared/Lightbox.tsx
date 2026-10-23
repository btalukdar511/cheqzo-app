"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";

export interface GalleryPhoto {
  url: string;
  caption?: string;
  kind?: "before" | "progress" | "after";
}

interface LightboxProps {
  photos: GalleryPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function Lightbox({ photos, index, onIndexChange, onClose }: LightboxProps) {
  const photo = photos[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, onIndexChange, photos.length]);

  if (!photo || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground/92 text-background" role="dialog" aria-modal="true" aria-label={photo.caption || "Photo"}>
      <div className="flex items-center justify-end p-4">
        <Button variant="ghost" size="icon" className="text-background hover:bg-background/10" onClick={onClose} aria-label="Close">
          <XIcon />
        </Button>
      </div>
      <div className="relative mx-auto min-h-0 w-full max-w-5xl flex-1">
        <SeedImage src={photo.url} alt={photo.caption || "Project photo"} sizes="80vw" />
      </div>
      <div className="flex items-center justify-between gap-4 p-4">
        <Button variant="ghost" size="icon" className="text-background hover:bg-background/10" onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)} aria-label="Previous photo">
          <ChevronLeftIcon />
        </Button>
        <p className="text-sm text-background">
          {photo.caption}
          {photo.kind ? <span className="ml-2 text-background/70">{photo.kind}</span> : null}
        </p>
        <Button variant="ghost" size="icon" className="text-background hover:bg-background/10" onClick={() => onIndexChange((index + 1) % photos.length)} aria-label="Next photo">
          <ChevronRightIcon />
        </Button>
      </div>
    </div>,
    document.body,
  );
}
