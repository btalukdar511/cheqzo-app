import { differenceInCalendarDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek, subWeeks } from "date-fns";

import { DEMO_NOW } from "@/lib/demo";
import { formatINRCompact } from "@/lib/format";
import { actorFromUser, can, projectNavBadges, type NavBadges, type ProjectSummary } from "@/lib/rules";
import type { ChangeRequest, Payment, Project, Room, SiteUpdate, User } from "@/types";

export const PAYMENT_STAGES = [
  "Advance",
  "Design",
  "Material",
  "Carpentry",
  "Electrical & Plumbing",
  "Finishing",
  "Handover",
] as const;

export type UpdateStatusFilter = "all" | SiteUpdate["status"];
export type UpdateSort = "newest" | "oldest";

export interface UpdateGroup {
  label: string;
  items: SiteUpdate[];
}

export interface ActivityEntry {
  id: string;
  title: string;
  meta: string;
  at: string;
  href: string;
}

export interface BudgetSlice {
  key: "paid" | "awaiting" | "remaining";
  label: string;
  amount: number;
}

export interface ActionItem {
  id: string;
  label: string;
  href: string;
}

const UPDATE_STATUS_LABEL: Record<SiteUpdate["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

const PAYMENT_STATUS_LABEL: Record<Payment["status"], string> = {
  awaiting_ack: "Awaiting acknowledgement",
  acknowledged: "Acknowledged",
  disputed: "Disputed",
};

const CHANGE_STATUS_LABEL: Record<ChangeRequest["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function isUpdateStatusFilter(value: string | null): value is UpdateStatusFilter {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "changes_requested" ||
    value === "rejected"
  );
}

export function isUpdateSort(value: string | null): value is UpdateSort {
  return value === "newest" || value === "oldest";
}

export function updateHref(projectId: string, updateId: string): string {
  return `/projects/${projectId}/updates?update=${updateId}`;
}

export function percentLabel(value: number): string {
  return `${Math.round(value)}%`;
}

export function roomName(rooms: Room[], roomId: string): string {
  return rooms.find((room) => room.id === roomId)?.name ?? "Room";
}

export function personName(users: User[], id: string): string {
  return users.find((user) => user.id === id)?.name ?? "Someone";
}

export function updateGroupLabel(iso: string, now: Date = DEMO_NOW): string {
  const date = parseISO(iso);
  const days = differenceInCalendarDays(now, date);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  const weekStartsOn = 1;
  const thisWeekStart = startOfWeek(now, { weekStartsOn });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn });
  if (isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd })) return "Last week";
  if (date >= thisWeekStart) return "This week";
  return format(date, "MMMM");
}

export function queryUpdates(
  updates: SiteUpdate[],
  query: { status: UpdateStatusFilter; roomId: string | null; sort: UpdateSort },
): SiteUpdate[] {
  const filtered = updates.filter((update) => {
    if (query.status !== "all" && update.status !== query.status) return false;
    if (query.roomId && update.roomId !== query.roomId) return false;
    return true;
  });
  return [...filtered].sort((left, right) => {
    const diff = left.createdAt.localeCompare(right.createdAt);
    return query.sort === "oldest" ? diff : -diff;
  });
}

export function groupUpdates(updates: SiteUpdate[], now: Date = DEMO_NOW): UpdateGroup[] {
  const groups: UpdateGroup[] = [];
  for (const update of updates) {
    const label = updateGroupLabel(update.createdAt, now);
    const current = groups[groups.length - 1];
    if (current?.label === label) current.items.push(update);
    else groups.push({ label, items: [update] });
  }
  return groups;
}

export function nextPaymentStage(payments: Payment[]): string {
  if (payments.length === 0) return PAYMENT_STAGES[0];
  const latest = [...payments].sort((left, right) => right.date.localeCompare(left.date))[0];
  if (!latest) return PAYMENT_STAGES[0];
  const index = PAYMENT_STAGES.indexOf(latest.stage);
  if (index < 0 || index >= PAYMENT_STAGES.length - 1) return PAYMENT_STAGES[PAYMENT_STAGES.length - 1];
  return PAYMENT_STAGES[index + 1];
}

export function budgetSlices(
  summary: Pick<ProjectSummary, "totalPaid" | "awaitingAcknowledgement" | "remaining">,
): BudgetSlice[] {
  return [
    { key: "paid", label: "Paid", amount: summary.totalPaid },
    { key: "awaiting", label: "Awaiting acknowledgement", amount: summary.awaitingAcknowledgement },
    {
      key: "remaining",
      label: "Still to record",
      amount: Math.max(0, summary.remaining - summary.awaitingAcknowledgement),
    },
  ];
}

export function recentActivity(input: {
  projectId: string;
  rooms: Room[];
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  limit?: number;
}): ActivityEntry[] {
  const updates: ActivityEntry[] = input.updates.map((update) => ({
    id: update.id,
    title: update.title,
    meta: `${roomName(input.rooms, update.roomId)} · ${UPDATE_STATUS_LABEL[update.status]}`,
    at: update.createdAt,
    href: updateHref(input.projectId, update.id),
  }));
  const payments: ActivityEntry[] = input.payments.map((payment) => ({
    id: payment.id,
    title: `${formatINRCompact(payment.amount)} · ${payment.stage}`,
    meta: PAYMENT_STATUS_LABEL[payment.status],
    at: payment.date,
    href: `/projects/${input.projectId}/financials`,
  }));
  const changes: ActivityEntry[] = input.changeRequests.map((request) => ({
    id: request.id,
    title: request.title,
    meta: CHANGE_STATUS_LABEL[request.status],
    at: request.createdAt,
    href: `/projects/${input.projectId}/changes`,
  }));
  return [...updates, ...payments, ...changes]
    .sort((left, right) => right.at.localeCompare(left.at))
    .slice(0, input.limit ?? 8);
}

export function overviewActions(input: {
  user: User;
  project: Project;
  rooms: Room[];
  updates: SiteUpdate[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
}): { badges: NavBadges; items: ActionItem[] } {
  const actor = actorFromUser(input.user);
  const projectId = input.project.id;
  const badges = projectNavBadges(projectId, input.updates, input.payments, input.changeRequests);
  const items: ActionItem[] = [];

  if (can(actor, "post_update").allowed) {
    for (const update of input.updates.filter((item) => item.status === "changes_requested")) {
      items.push({
        id: update.id,
        label: `Revise ${roomName(input.rooms, update.roomId)} update`,
        href: updateHref(projectId, update.id),
      });
    }
    for (const payment of input.payments.filter((item) => item.status === "disputed")) {
      items.push({
        id: payment.id,
        label: `Resolve ${formatINRCompact(payment.amount)} dispute`,
        href: `/projects/${projectId}/financials`,
      });
    }
    return { badges, items };
  }

  for (const update of input.updates.filter((item) => item.status === "pending")) {
    items.push({
      id: update.id,
      label: `${roomName(input.rooms, update.roomId)}: ${update.title}`,
      href: updateHref(projectId, update.id),
    });
  }
  for (const payment of input.payments.filter((item) => item.status === "awaiting_ack")) {
    items.push({
      id: payment.id,
      label: `Acknowledge ${formatINRCompact(payment.amount)} payment`,
      href: `/projects/${projectId}/financials`,
    });
  }
  for (const request of input.changeRequests.filter((item) => item.status === "pending")) {
    const decision = can(actor, "decide_change_request", {
      raisedById: request.raisedById,
      raisedByRole: request.raisedByRole,
    });
    if (!decision.allowed) continue;
    items.push({
      id: request.id,
      label: `Decide ${request.title}`,
      href: `/projects/${projectId}/changes`,
    });
  }
  return { badges, items };
}
