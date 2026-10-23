import { formatINRCompact } from "@/lib/format";
import { paymentHref, updateHref } from "@/lib/project-view";
import { actorFromUser, can, projectsForUser, summarizeProject, type ProjectSummary } from "@/lib/rules";
import type {
  ChangeRequest,
  Health,
  Payment,
  Project,
  Room,
  SiteUpdate,
  TeamMember,
  User,
} from "@/types";

export type HealthFilter = "all" | Health;
export type PortfolioSort = "health" | "progress" | "deadline";

export interface ActionLink {
  id: string;
  label: string;
  href: string;
}

export interface LatestUpdate {
  title: string;
  caption: string;
  photoUrl: string;
  href: string;
}

export interface PortfolioItem {
  project: Project;
  summary: ProjectSummary;
  pendingUpdates: number;
  homeownerName: string;
  designerName: string;
  actions: ActionLink[];
  latestUpdate?: LatestUpdate;
}

export interface PortfolioKpis {
  activeProjects: number;
  totalBudget: number;
  totalPaid: number;
  actionItems: number;
  pendingApprovals: number;
  awaitingAcknowledgement: number;
  projectsAtRisk: number;
}

const HEALTH_RANK: Record<Health, number> = {
  at_risk: 0,
  needs_attention: 1,
  on_track: 2,
};

function personName(users: User[], id: string): string {
  return users.find((user) => user.id === id)?.name ?? "Unknown";
}

function roomName(rooms: Room[], roomId: string): string {
  return rooms.find((room) => room.id === roomId)?.name ?? "Room";
}

function projectActions(input: {
  user: User;
  project: Project;
  rooms: Room[];
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
}): ActionLink[] {
  const actor = actorFromUser(input.user);
  const projectId = input.project.id;
  const updates = input.updates.filter((item) => item.projectId === projectId);
  const payments = input.payments.filter((item) => item.projectId === projectId);
  const requests = input.changeRequests.filter((item) => item.projectId === projectId);
  const dated: { at: string; link: ActionLink }[] = [];

  if (can(actor, "decide_update").allowed) {
    for (const update of updates.filter((item) => item.status === "pending")) {
      dated.push({
        at: update.createdAt,
        link: {
          id: update.id,
          label: `Approve ${roomName(input.rooms, update.roomId)} update`,
          href: updateHref(projectId, update.id),
        },
      });
    }
  } else {
    for (const update of updates.filter((item) => item.status === "changes_requested")) {
      dated.push({
        at: update.createdAt,
        link: {
          id: update.id,
          label: `Revise ${roomName(input.rooms, update.roomId)} update`,
          href: updateHref(projectId, update.id),
        },
      });
    }
  }

  if (can(actor, "decide_payment").allowed) {
    for (const payment of payments.filter((item) => item.status === "awaiting_ack")) {
      dated.push({
        at: payment.date,
        link: {
          id: payment.id,
          label: `Acknowledge ${formatINRCompact(payment.amount)} payment`,
          href: paymentHref(projectId, payment.id),
        },
      });
    }
  } else if (can(actor, "record_payment").allowed) {
    for (const payment of payments.filter((item) => item.status === "disputed")) {
      dated.push({
        at: payment.date,
        link: {
          id: payment.id,
          label: `Resolve ${formatINRCompact(payment.amount)} dispute`,
          href: paymentHref(projectId, payment.id),
        },
      });
    }
  }

  for (const request of requests.filter((item) => item.status === "pending")) {
    const decision = can(actor, "decide_change_request", {
      raisedById: request.raisedById,
      raisedByRole: request.raisedByRole,
    });
    if (!decision.allowed) continue;
    dated.push({
      at: request.createdAt,
      link: {
        id: request.id,
        label: `Review ${request.title}`,
        href: `/projects/${projectId}/changes`,
      },
    });
  }

  return dated
    .sort((left, right) => right.at.localeCompare(left.at))
    .map((item) => item.link);
}

export function assemblePortfolio(input: {
  user: User;
  projects: Project[];
  rooms: Room[];
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  teamMembers: TeamMember[];
  users: User[];
}): PortfolioItem[] {
  const visible = projectsForUser(input.user, input.projects, input.teamMembers);
  return visible.map((project) => {
    const summary = summarizeProject({
      project,
      rooms: input.rooms,
      updates: input.updates,
      payments: input.payments,
      changeRequests: input.changeRequests,
    });
    const projectUpdates = input.updates.filter((item) => item.projectId === project.id);
    const latest = [...projectUpdates].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    const photo = latest?.photos[0];
    return {
      project,
      summary,
      pendingUpdates: projectUpdates.filter((item) => item.status === "pending").length,
      homeownerName: personName(input.users, project.homeownerId),
      designerName: personName(input.users, project.designerId),
      actions: projectActions({
        user: input.user,
        project,
        rooms: input.rooms,
        updates: input.updates,
        payments: input.payments,
        changeRequests: input.changeRequests,
      }),
      latestUpdate: latest
        ? {
            title: latest.title,
            caption: photo?.caption ?? latest.title,
            photoUrl: photo?.url ?? project.coverImage,
            href: `/projects/${project.id}/updates`,
          }
        : undefined,
    };
  });
}

export function portfolioKpis(items: PortfolioItem[]): PortfolioKpis {
  return {
    activeProjects: items.filter((item) => item.project.status === "active").length,
    totalBudget: items.reduce((total, item) => total + item.summary.estimatedCost, 0),
    totalPaid: items.reduce((total, item) => total + item.summary.totalPaid, 0),
    actionItems: items.reduce((total, item) => total + item.actions.length, 0),
    pendingApprovals: items.reduce((total, item) => total + item.pendingUpdates, 0),
    awaitingAcknowledgement: items.reduce((total, item) => total + item.summary.awaitingAcknowledgement, 0),
    projectsAtRisk: items.filter((item) => item.summary.health === "at_risk").length,
  };
}

export function queryPortfolio(
  items: PortfolioItem[],
  query: { search: string; health: HealthFilter; sort: PortfolioSort },
): PortfolioItem[] {
  const needle = query.search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (query.health !== "all" && item.summary.health !== query.health) return false;
    if (!needle) return true;
    const haystack = [
      item.project.name,
      item.project.propertyType,
      item.project.bhk,
      item.project.location.area,
      item.project.location.city,
      item.homeownerName,
      item.designerName,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  return [...filtered].sort((left, right) => {
    const diff =
      query.sort === "progress"
        ? left.summary.progress - right.summary.progress
        : query.sort === "deadline"
          ? left.summary.projectedEndDate.localeCompare(right.summary.projectedEndDate)
          : HEALTH_RANK[left.summary.health] - HEALTH_RANK[right.summary.health];
    if (diff !== 0) return diff;
    return left.project.name.localeCompare(right.project.name);
  });
}
