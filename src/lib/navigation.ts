import { formatINR } from "@/lib/format";
import { paymentHref, recordPaymentHref } from "@/lib/project-view";
import { actorFromUser, can, projectsForUser } from "@/lib/rules";
import type { ChangeRequest, Payment, Project, Room, TeamMember, User } from "@/types";

const SECTIONS = ["updates", "financials", "changes", "rooms", "team", "settings"] as const;

type Section = (typeof SECTIONS)[number];

export interface CommandEntry {
  id: string;
  group: "Projects" | "Rooms" | "Payments" | "Change requests" | "Actions";
  label: string;
  hint?: string;
  href: string;
}

export function isInternalHref(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  return !href.includes("://") && !href.includes("\\");
}

export function activeProjectId(pathname: string): string | null {
  const match = /^\/projects\/([^/?]+)/.exec(pathname);
  if (!match || match[1] === "new") return null;
  return match[1];
}

export function hrefForProject(pathname: string, projectId: string): string {
  const match = /^\/projects\/(?!new(?:\/|$))[^/]+\/([^/?]+)/.exec(pathname);
  const section = match?.[1];
  if (section && SECTIONS.includes(section as Section)) return `/projects/${projectId}/${section}`;
  return `/projects/${projectId}`;
}

function projectName(projects: Project[], projectId: string): string {
  return projects.find((project) => project.id === projectId)?.name ?? "Project";
}

export function commandEntries(input: {
  user: User;
  projects: Project[];
  rooms: Room[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  teamMembers: TeamMember[];
  activeProjectId: string | null;
}): CommandEntry[] {
  const visible = projectsForUser(input.user, input.projects, input.teamMembers);
  const visibleIds = new Set(visible.map((project) => project.id));
  const actor = actorFromUser(input.user);
  const targetId =
    input.activeProjectId && visibleIds.has(input.activeProjectId) ? input.activeProjectId : (visible[0]?.id ?? null);
  const entries: CommandEntry[] = visible.map((project) => ({
    id: `project-${project.id}`,
    group: "Projects",
    label: project.name,
    hint: `${project.location.area}, ${project.location.city}`,
    href: `/projects/${project.id}`,
  }));

  for (const room of input.rooms) {
    if (!visibleIds.has(room.projectId)) continue;
    entries.push({
      id: `room-${room.id}`,
      group: "Rooms",
      label: room.name,
      hint: projectName(visible, room.projectId),
      href: `/projects/${room.projectId}/rooms?room=${room.id}`,
    });
  }

  for (const payment of input.payments) {
    if (!visibleIds.has(payment.projectId)) continue;
    entries.push({
      id: `payment-${payment.id}`,
      group: "Payments",
      label: `${formatINR(payment.amount)} · ${payment.stage}`,
      hint: projectName(visible, payment.projectId),
      href: paymentHref(payment.projectId, payment.id),
    });
  }

  for (const request of input.changeRequests) {
    if (!visibleIds.has(request.projectId)) continue;
    entries.push({
      id: `change-${request.id}`,
      group: "Change requests",
      label: request.title,
      hint: projectName(visible, request.projectId),
      href: `/projects/${request.projectId}/changes`,
    });
  }

  entries.push({ id: "action-portfolio", group: "Actions", label: "Open portfolio", href: "/dashboard" });
  if (can(actor, "create_project").allowed) {
    entries.push({ id: "action-new-project", group: "Actions", label: "New project", href: "/projects/new" });
  }
  if (targetId && can(actor, "post_update").allowed) {
    entries.push({
      id: "action-post-update",
      group: "Actions",
      label: "Post site update",
      href: `/projects/${targetId}/updates`,
    });
  }
  if (targetId && can(actor, "record_payment").allowed) {
    entries.push({
      id: "action-record-payment",
      group: "Actions",
      label: "Record payment",
      href: recordPaymentHref(targetId),
    });
  }
  if (targetId && can(actor, "raise_change_request").allowed) {
    entries.push({
      id: "action-raise-change",
      group: "Actions",
      label: "Raise change request",
      href: `/projects/${targetId}/changes`,
    });
  }
  entries.push({ id: "action-settings", group: "Actions", label: "Settings", href: "/settings" });
  return entries;
}
