"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { SeedImage } from "@/components/shared/SeedImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/data/live";
import { useSession } from "@/store/session";
import type { User } from "@/types";

function roleLabel(user: User): string {
  if (user.accountKind === "designer") return user.studioName ?? "Interior designer";
  if (user.accountKind === "family") return "Family";
  return "Homeowner";
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function AvatarMenu() {
  const user = useCurrentUser();
  const signOut = useSession((state) => state.signOut);
  const router = useRouter();
  if (!user) return null;

  function openSettings() {
    router.push("/settings");
  }

  function signOutAndLeave() {
    signOut();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="relative size-8 overflow-hidden rounded-full border border-border bg-secondary text-xs font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {user.avatarUrl ? (
            <SeedImage src={user.avatarUrl} alt="" sizes="32px" />
          ) : (
            <span className="flex size-full items-center justify-center">{initials(user.name)}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium text-foreground">{user.name}</span>
          <span className="block text-xs text-muted-foreground">{roleLabel(user)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openSettings}>
          <UserRound />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openSettings}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOutAndLeave}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
