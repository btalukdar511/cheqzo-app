"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

import { AvatarMenu } from "@/components/shell/AvatarMenu";
import { NotificationsPopover } from "@/components/shell/NotificationsPopover";
import { ProjectSwitcher } from "@/components/shell/ProjectSwitcher";
import { RoleSwitcher } from "@/components/shell/RoleSwitcher";
import { useShellUi } from "@/components/shell/shell-ui";

function subscribeModLabel(): () => void {
  return () => undefined;
}

function readModLabel(): string {
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
}

function useModLabel(): string {
  return useSyncExternalStore(subscribeModLabel, readModLabel, () => "Ctrl");
}

export function Topbar() {
  const { setCommandOpen } = useShellUi();
  const mod = useModLabel();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-6">
      <ProjectSwitcher />
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search</span>
        <kbd className="ml-auto rounded-md border border-border bg-surface px-1.5 text-[11px]">{mod} K</kbd>
      </button>
      <NotificationsPopover />
      <RoleSwitcher />
      <AvatarMenu />
    </header>
  );
}
