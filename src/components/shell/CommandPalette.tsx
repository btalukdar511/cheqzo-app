"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCurrentUser, useLiveDb } from "@/data/live";
import { activeProjectId, commandEntries, isInternalHref } from "@/lib/navigation";
import { useShellUi } from "@/components/shell/shell-ui";

const GROUPS = ["Projects", "Rooms", "Payments", "Change requests", "Actions"] as const;

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useShellUi();
  const user = useCurrentUser();
  const db = useLiveDb();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;

  const entries = commandEntries({
    user,
    projects: db.projects,
    rooms: db.rooms,
    payments: db.payments,
    changeRequests: db.changeRequests,
    teamMembers: db.teamMembers,
    activeProjectId: activeProjectId(pathname),
  });

  function go(href: string) {
    if (!isInternalHref(href)) return;
    setCommandOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      title="Search"
      description="Jump to a project, room, payment, change request, or action."
      className="sm:max-w-lg"
    >
      <Command>
        <CommandInput placeholder="Search projects, rooms, payments, or actions" />
        <CommandList>
          <CommandEmpty>No matches</CommandEmpty>
          {GROUPS.map((group) => {
            const items = entries.filter((entry) => entry.group === group);
            if (items.length === 0) return null;
            return (
              <CommandGroup key={group} heading={group}>
                {items.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={`${entry.label} ${entry.hint ?? ""} ${entry.id}`}
                    onSelect={() => go(entry.href)}
                  >
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    {entry.hint ? (
                      <span className="max-w-40 truncate text-xs text-muted-foreground">{entry.hint}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
