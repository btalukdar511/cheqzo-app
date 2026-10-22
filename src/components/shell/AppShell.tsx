"use client";

import { TriangleAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AuthGate } from "@/components/shell/AuthGate";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ShellUiProvider } from "@/components/shell/shell-ui";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

function ContentSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function DemoErrorGate({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  if (params.get("fail") === "1") {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="This page didn't load"
        description="Something got in the way. Retry to bring the view back."
        actionLabel="Retry"
        onAction={() => {
          const next = new URLSearchParams(params);
          next.delete("fail");
          const query = next.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }}
      />
    );
  }

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate area="app">
      <ShellUiProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1600px] px-8 py-8">
                <Suspense fallback={<ContentSkeleton />}>
                  <DemoErrorGate>{children}</DemoErrorGate>
                </Suspense>
              </div>
            </main>
          </div>
        </div>
        <CommandPalette />
      </ShellUiProvider>
    </AuthGate>
  );
}
