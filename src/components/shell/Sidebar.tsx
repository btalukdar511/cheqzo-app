"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DoorOpen,
  GitPullRequest,
  Images,
  IndianRupee,
  LayoutDashboard,
  PanelsTopLeft,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Wordmark } from "@/components/shell/Wordmark";
import { useCurrentUser, useLiveDb } from "@/data/live";
import { activeProjectId } from "@/lib/navigation";
import { projectNavBadges, projectsForUser } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  count?: number;
}

function NavItem({ href, label, icon: Icon, active, count = 0 }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-sidebar-accent font-medium text-primary before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
          : "hover:bg-muted",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {count > 0 ? (
        <span className="ml-auto rounded-full bg-primary px-1.5 text-[11px] leading-4 font-medium text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const db = useLiveDb();
  const projectId = activeProjectId(pathname);
  const visible = user ? projectsForUser(user, db.projects, db.teamMembers) : [];
  const project = visible.find((item) => item.id === projectId) ?? null;
  const badges = project ? projectNavBadges(project.id, db.updates, db.payments, db.changeRequests) : null;
  const base = project ? `/projects/${project.id}` : "";

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border bg-surface">
      <Link
        href="/dashboard"
        className="flex h-16 items-center px-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Wordmark />
      </Link>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <NavItem href="/dashboard" label="Projects" icon={LayoutDashboard} active={pathname === "/dashboard"} />
        {project && badges ? (
          <div className="mt-5">
            <p className="mb-2 truncate px-3 text-xs font-medium text-muted-foreground">{project.name}</p>
            <div className="flex flex-col gap-1">
              <NavItem href={base} label="Overview" icon={PanelsTopLeft} active={pathname === base} />
              <NavItem
                href={`${base}/updates`}
                label="Updates"
                icon={Images}
                active={pathname.startsWith(`${base}/updates`)}
                count={badges.updates}
              />
              <NavItem
                href={`${base}/financials`}
                label="Financials"
                icon={IndianRupee}
                active={pathname.startsWith(`${base}/financials`)}
                count={badges.payments}
              />
              <NavItem
                href={`${base}/changes`}
                label="Change Requests"
                icon={GitPullRequest}
                active={pathname.startsWith(`${base}/changes`)}
                count={badges.changes}
              />
              <NavItem
                href={`${base}/rooms`}
                label="Rooms"
                icon={DoorOpen}
                active={pathname.startsWith(`${base}/rooms`)}
                count={0}
              />
              <NavItem
                href={`${base}/team`}
                label="Team"
                icon={Users}
                active={pathname.startsWith(`${base}/team`)}
                count={0}
              />
            </div>
          </div>
        ) : null}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <NavItem href="/settings" label="Settings" icon={Settings} active={pathname === "/settings"} />
      </div>
    </aside>
  );
}
