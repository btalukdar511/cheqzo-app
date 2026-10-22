"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthSkeleton } from "@/components/shell/AuthGate";
import { useStoresReady } from "@/data/live";
import { authDestination } from "@/lib/auth";
import { useSession } from "@/store/session";

export default function HomePage() {
  const ready = useStoresReady();
  const phone = useSession((state) => state.phone);
  const userId = useSession((state) => state.userId);
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(authDestination({ phone, userId }));
  }, [phone, ready, router, userId]);

  return <AuthSkeleton />;
}
