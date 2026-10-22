"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { HealthBadge } from "@/components/shared/HealthBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useLiveDb } from "@/data/live";
import { activeProjectId, hrefForProject } from "@/lib/navigation";
import { projectHealth, projectsForUser } from "@/lib/rules";

export function ProjectSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const db = useLiveDb();
  const projects = user ? projectsForUser(user, db.projects, db.teamMembers) : [];
  const currentId = activeProjectId(pathname);
  const current = projects.find((project) => project.id === currentId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 max-w-[240px] justify-between gap-2 px-3" aria-label="Switch project">
          <span className="truncate">{current?.name ?? "Select a project"}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {projects.map((project) => {
          const health = projectHealth({
            project,
            updates: db.updates,
            payments: db.payments,
            changeRequests: db.changeRequests,
          });
          return (
            <DropdownMenuItem
              key={project.id}
              onSelect={() => router.push(hrefForProject(pathname, project.id))}
              className="justify-between gap-3"
            >
              <span className="truncate">{project.name}</span>
              <HealthBadge health={health.health} reasons={health.reasons} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
