"use client";

import { SearchX } from "lucide-react";

import { PersonChip } from "@/components/features/financials/person-chip";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { impactTone, signedDays, signedMoney, type ChangeStatusFilter, type RaisedByFilter } from "@/lib/changes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChangeRequest, Room, User } from "@/types";

const ROLE_LABEL = { homeowner: "Homeowner", designer: "Designer" } as const;

const TONE = {
  increase: "text-danger",
  saving: "text-success",
  none: "text-muted-foreground",
} as const;

export function ChangeTable({
  requests,
  rooms,
  users,
  status,
  raisedBy,
  selectedId,
  filtered,
  onStatus,
  onRaisedBy,
  onClear,
  onSelect,
}: {
  requests: ChangeRequest[];
  rooms: Room[];
  users: User[];
  status: ChangeStatusFilter;
  raisedBy: RaisedByFilter;
  selectedId: string | null;
  filtered: boolean;
  onStatus: (status: ChangeStatusFilter) => void;
  onRaisedBy: (raisedBy: RaisedByFilter) => void;
  onClear: () => void;
  onSelect: (requestId: string) => void;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 flex gap-2 border-b border-border bg-surface p-3">
        <Select value={status} onValueChange={(value) => onStatus(value as ChangeStatusFilter)}>
          <SelectTrigger aria-label="Status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={raisedBy} onValueChange={(value) => onRaisedBy(value as RaisedByFilter)}>
          <SelectTrigger aria-label="Raised by" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anyone</SelectItem>
            <SelectItem value="homeowner">Homeowner</SelectItem>
            <SelectItem value="designer">Designer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {requests.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={filtered ? "No requests match" : "No change requests"}
          description={filtered ? "Try another status or person." : "Cost and timeline changes will show up here."}
          actionLabel={filtered ? "Clear filters" : undefined}
          onAction={filtered ? onClear : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Room</th>
                <th className="px-3 py-2 font-medium">Raised by</th>
                <th className="px-3 py-2 text-right font-medium">Cost impact</th>
                <th className="px-3 py-2 font-medium">Days</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const tone = impactTone(request.costImpact);
                const raiser = users.find((user) => user.id === request.raisedById);
                return (
                  <tr
                    key={request.id}
                    className={cn("cursor-pointer border-b border-border last:border-0 hover:bg-secondary/70", selectedId === request.id && "bg-secondary")}
                    onClick={() => onSelect(request.id)}
                  >
                    <td className="max-w-40 px-3 py-2 font-medium text-foreground">
                      <span className="line-clamp-2">{request.title}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{rooms.find((room) => room.id === request.roomId)?.name ?? "—"}</td>
                    <td className="px-3 py-2">
                      <PersonChip user={raiser} />
                      <span className="mt-0.5 block text-xs text-muted-foreground">{ROLE_LABEL[request.raisedByRole]}</span>
                    </td>
                    <td className={cn("px-3 py-2 text-right font-medium tabular-nums", TONE[tone])}>{signedMoney(request.costImpact)}</td>
                    <td className="px-3 py-2 tabular-nums text-foreground">{signedDays(request.daysImpact)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDate(request.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
