"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useStoresReady } from "@/data/live";
import { isAreaAllowed, type AuthArea } from "@/lib/auth";
import { useSession } from "@/store/session";

export function AuthSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
      <div className="w-full max-w-sm space-y-3 px-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  );
}

export function AuthGate({ area, children }: { area: AuthArea; children: ReactNode }) {
  const ready = useStoresReady();
  const phone = useSession((state) => state.phone);
  const userId = useSession((state) => state.userId);
  const router = useRouter();
  const session = { phone, userId };
  const allowed = ready && isAreaAllowed(area, session);

  useEffect(() => {
    if (!ready || allowed) return;
    const destination = userId ? "/dashboard" : phone ? "/role" : "/login";
    router.replace(destination);
  }, [allowed, phone, ready, router, userId]);

  // The store hydrates on the client. Keep the page in the tree until then so the
  // route can prerender; the redirect only replaces it once the session is known.
  if (!ready) return children;
  if (!allowed) return <AuthSkeleton />;
  return children;
}
