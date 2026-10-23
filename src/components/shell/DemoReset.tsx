"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useStoresReady } from "@/data/live";
import { useDb } from "@/store/db";

export function DemoReset() {
  const ready = useStoresReady();
  const params = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current || params.get("reset") !== "1") return;
    started.current = true;
    useDb.getState().reset();
    const url = new URL(window.location.href);
    url.searchParams.delete("reset");
    window.location.replace(`${url.pathname}${url.search}${url.hash}`);
  }, [ready, params]);

  return null;
}
