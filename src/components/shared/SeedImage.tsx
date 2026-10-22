"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

interface SeedImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export function SeedImage({ src, alt, className, sizes = "320px" }: SeedImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const remote = src.startsWith("http://") || src.startsWith("https://");

  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--secondary),var(--border))]">
      {failed ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-5" />
        </div>
      ) : remote ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn("object-cover transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0", className)}
        />
      ) : (
        // Session uploads are blob or data URLs and are not sent through the image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", loaded ? "opacity-100" : "opacity-0", className)}
        />
      )}
    </div>
  );
}
