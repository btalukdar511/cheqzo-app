import { format, parseISO } from "date-fns";

import { formatINR, formatINRCompact } from "@/lib/format";
import { impactPreview } from "@/lib/rules";
import type { ChangeRequest, Project } from "@/types";

export type ChangeStatusFilter = "all" | ChangeRequest["status"];
export type RaisedByFilter = "all" | ChangeRequest["raisedByRole"];

export interface ChangeKpis {
  pending: number;
  netCost: number;
  netDays: number;
  nextDue: string | null;
}

export function isChangeStatusFilter(value: string | null): value is ChangeStatusFilter {
  return value === "all" || value === "pending" || value === "approved" || value === "rejected" || value === "withdrawn";
}

export function isRaisedByFilter(value: string | null): value is RaisedByFilter {
  return value === "all" || value === "homeowner" || value === "designer";
}

export function queryChanges(
  requests: ChangeRequest[],
  filter: { status: ChangeStatusFilter; raisedBy: RaisedByFilter },
): ChangeRequest[] {
  return requests
    .filter((request) => filter.status === "all" || request.status === filter.status)
    .filter((request) => filter.raisedBy === "all" || request.raisedByRole === filter.raisedBy)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function changeKpis(requests: ChangeRequest[]): ChangeKpis {
  const pending = requests.filter((request) => request.status === "pending");
  const approved = requests.filter((request) => request.status === "approved");
  const oldest = [...pending].sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
  return {
    pending: pending.length,
    netCost: approved.reduce((total, request) => total + request.costImpact, 0),
    netDays: approved.reduce((total, request) => total + request.daysImpact, 0),
    nextDue: oldest?.createdAt ?? null,
  };
}

export function impactTone(amount: number): "increase" | "saving" | "none" {
  if (amount > 0) return "increase";
  if (amount < 0) return "saving";
  return "none";
}

export function signedMoney(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded > 0) return `+${formatINR(rounded)}`;
  if (rounded < 0) return `−${formatINR(Math.abs(rounded))}`;
  return formatINR(0);
}

export function signedCompact(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded > 0) return `+${formatINRCompact(rounded)}`;
  if (rounded < 0) return `−${formatINRCompact(Math.abs(rounded))}`;
  return formatINRCompact(0);
}

export function signedDays(days: number): string {
  const rounded = Math.round(days);
  if (rounded > 0) return `+${rounded} days`;
  if (rounded < 0) return `${rounded} days`;
  return "0 days";
}

export function previewCopy(
  project: Project,
  requests: ChangeRequest[],
  request: ChangeRequest,
): { cost: string; end: string; costBefore: number; costAfter: number } {
  const preview = impactPreview(project, requests, request);
  const endBefore = format(parseISO(preview.endBefore), "d MMM");
  const endAfter = format(parseISO(preview.endAfter), "d MMM");
  return {
    cost: `Estimated cost ${formatINRCompact(preview.costBefore)} → ${formatINRCompact(preview.costAfter)}`,
    end: `End date ${endBefore} → ${endAfter}`,
    costBefore: preview.costBefore,
    costAfter: preview.costAfter,
  };
}
