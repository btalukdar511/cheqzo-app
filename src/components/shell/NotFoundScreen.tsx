"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/shell/Wordmark";
import { cn } from "@/lib/utils";

interface NotFoundScreenProps {
  title?: string;
  message?: string;
  framed?: boolean;
}

export function NotFoundScreen({
  title = "This page isn't available",
  message = "The link may be wrong, or this page isn't part of your account.",
  framed = false,
}: NotFoundScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        framed ? "min-h-[60vh]" : "min-h-screen bg-background",
      )}
    >
      {framed ? null : <Wordmark />}
      <NotFoundMark />
      <h1 className="mt-6 font-display text-[28px] leading-9 font-semibold text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground">{message}</p>
      <Button asChild className="mt-6 h-10 px-4">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

function NotFoundMark() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden className="mt-8 text-primary">
      <rect x="18" y="22" width="60" height="52" rx="8" stroke="currentColor" strokeWidth="2" />
      <path d="M18 36h60" stroke="currentColor" strokeWidth="2" />
      <path d="M36 50h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 58h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="66" cy="58" r="7" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}
