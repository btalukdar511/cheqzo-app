"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

import { AuthGate } from "@/components/shell/AuthGate";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { InviteWatcher } from "@/components/shell/InviteWatcher";
import { ShellUiProvider } from "@/components/shell/shell-ui";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

function ShellFallback({ className }: { className: string }) {
  return <div className={className} aria-busy="true" />;
}

function ContentSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function FailSync({ onFailed }: { onFailed: (failed: boolean) => void }) {
  const params = useSearchParams();
  const failed = params.get("fail") === "1";

  useEffect(() => {
    onFailed(failed);
  }, [failed, onFailed]);

  return null;
}

function PageFrame({ failed, children }: { failed: boolean; children: ReactNode }) {
  const router = useRouter();

  if (failed) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="This page didn't load"
        description="Something got in the way. Retry to bring the view back."
        actionLabel="Retry"
        onAction={() => {
          const next = new URL(window.location.href);
          next.searchParams.delete("fail");
          router.replace(`${next.pathname}${next.search}`);
        }}
      />
    );
  }

  return (
    <Suspense fallback={<ContentSkeleton />}>
      <div className="page-enter">{children}</div>
    </Suspense>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [failed, setFailed] = useState(false);

  return (
    <AuthGate area="app">
      <ShellUiProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Suspense fallback={<ShellFallback className="h-full w-[248px] shrink-0 border-r border-border bg-surface" />}>
            <Sidebar />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col">
            <Suspense fallback={<ShellFallback className="h-16 shrink-0 border-b border-border bg-surface" />}>
              <Topbar />
            </Suspense>
            <main className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1600px] px-8 py-8">
                <Suspense fallback={null}>
                  <FailSync onFailed={setFailed} />
                </Suspense>
                <PageFrame failed={failed}>{children}</PageFrame>
              </div>
            </main>
          </div>
        </div>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
        <InviteWatcher />
      </ShellUiProvider>
    </AuthGate>
  );
}
