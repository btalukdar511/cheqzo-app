import { Check } from "lucide-react";

const STATUS_PRESENTATION: Record<string, { label: string; className: string; confirmed?: boolean }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning" },
  approved: { label: "Approved", className: "bg-success/10 text-success" },
  rejected: { label: "Rejected", className: "bg-danger/10 text-danger" },
  changes_requested: { label: "Changes Requested", className: "bg-info/10 text-info" },
  awaiting_ack: { label: "Awaiting Ack", className: "bg-warning/10 text-warning" },
  acknowledged: { label: "Acknowledged", className: "bg-success/10 text-success", confirmed: true },
  disputed: { label: "Disputed", className: "bg-danger/10 text-danger" },
  invited: { label: "Invited", className: "bg-info/10 text-info" },
  active: { label: "Active", className: "bg-success/10 text-success" },
  not_started: { label: "Not started", className: "bg-secondary text-muted-foreground" },
  in_progress: { label: "In progress", className: "bg-info/10 text-info" },
  awaiting_approval: { label: "Awaiting approval", className: "bg-warning/10 text-warning" },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
  proposed: { label: "Proposed", className: "bg-secondary text-muted-foreground" },
  ordered: { label: "Ordered", className: "bg-info/10 text-info" },
  installed: { label: "Installed", className: "bg-success/10 text-success" },
  on_hold: { label: "On hold", className: "bg-warning/10 text-warning" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const presentation = STATUS_PRESENTATION[status] ?? {
    label: status,
    className: "bg-secondary text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${presentation.className}`}>
      {presentation.label}
      {presentation.confirmed ? <Check className="size-3" aria-hidden /> : null}
    </span>
  );
}
