"use client";

import { useState } from "react";
import { GitPullRequest } from "lucide-react";
import { toast } from "sonner";

import { PersonChip } from "@/components/features/financials/person-chip";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/data/api";
import { impactTone, previewCopy, signedDays, signedMoney } from "@/lib/changes";
import { formatDate, formatINRCompact, relativeTime } from "@/lib/format";
import { personName } from "@/lib/project-view";
import { can, type Actor } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { ChangeRequest, Project, Room, User } from "@/types";

const TONE = {
  increase: "text-danger",
  saving: "text-success",
  none: "text-foreground",
} as const;

export function ChangeDetail({
  request,
  project,
  requests,
  rooms,
  users,
  userId,
  actor,
}: {
  request: ChangeRequest | null;
  project: Project;
  requests: ChangeRequest[];
  rooms: Room[];
  users: User[];
  userId: string;
  actor: Actor;
}) {
  const [comment, setComment] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!request) {
    return <EmptyState icon={GitPullRequest} title="Select a change request" description="Cost and timeline impact show up here." />;
  }
  const current = request;

  const preview = previewCopy(project, requests, current);
  const decision = can(actor, "decide_change_request", { raisedById: current.raisedById, raisedByRole: current.raisedByRole });
  const isRaiser = actor.id === current.raisedById;
  const roomName = rooms.find((room) => room.id === current.roomId)?.name;
  const raiser = users.find((user) => user.id === current.raisedById);
  const costTone = impactTone(current.costImpact);
  const maxCost = Math.max(preview.costBefore, preview.costAfter, 1);

  async function approve() {
    setBusy(true);
    try {
      await api.approveChangeRequest(userId, current.id);
      toast.success(`Change approved. Estimated cost is now ${formatINRCompact(preview.costAfter)}.`);
      setApproveOpen(false);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not approve the request");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await api.rejectChangeRequest(userId, current.id, comment);
      toast.success("Change request rejected");
      setComment("");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not reject the request");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    try {
      await api.withdrawChangeRequest(userId, current.id);
      toast.success("Change request withdrawn");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not withdraw the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl leading-8 font-semibold text-foreground">{current.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {roomName ? `${roomName} · ` : ""}
            {formatDate(current.createdAt)} · {relativeTime(current.createdAt)}
          </p>
        </div>
        <StatusBadge status={current.status} />
      </div>
      <p className="text-sm leading-6 text-foreground">{current.description}</p>
      <PersonChip user={raiser} />
      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Cost impact</p>
          <p className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", TONE[costTone])}>{signedMoney(current.costImpact)}</p>
        </article>
        <article className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Timeline impact</p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground tabular-nums">{signedDays(current.daysImpact)}</p>
        </article>
      </div>
      {current.status === "pending" ? (
        <section className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Impact preview</h3>
          <p className="text-sm text-foreground">{preview.cost}</p>
          <p className="text-sm text-foreground">{preview.end}</p>
          <ImpactBar label="Cost now" width={(preview.costBefore / maxCost) * 100} className="bg-muted-foreground/40" />
          <ImpactBar label="Cost if approved" width={(preview.costAfter / maxCost) * 100} className={costTone === "saving" ? "bg-success" : "bg-primary"} />
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-secondary/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">Decision</h3>
          <p className="mt-1 text-sm text-foreground">
            {current.status === "approved" ? "Approved" : current.status === "rejected" ? "Rejected" : "Withdrawn"}
            {current.decidedAt ? ` · ${formatDate(current.decidedAt)}` : ""}
          </p>
          {current.status !== "withdrawn" && current.decidedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">Notified {personName(users, current.raisedById)}</p>
          ) : null}
          {current.decisionComment ? <p className="mt-2 text-sm text-foreground">{current.decisionComment}</p> : null}
        </section>
      )}
      {current.status === "pending" && isRaiser ? (
        <Button variant="outline" onClick={() => setWithdrawOpen(true)} disabled={busy}>
          Withdraw
        </Button>
      ) : null}
      {current.status === "pending" && !isRaiser ? (
        <div className="space-y-3">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comment (optional)" />
          <div className="flex gap-2">
            <RoleGuard allowed={decision.allowed} reason={decision.reason}>
              <Button onClick={() => setApproveOpen(true)} disabled={busy}>
                Approve
              </Button>
            </RoleGuard>
            <RoleGuard allowed={decision.allowed} reason={decision.reason}>
              <Button variant="outline" onClick={() => void reject()} disabled={busy}>
                Reject
              </Button>
            </RoleGuard>
          </div>
        </div>
      ) : null}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve this change?</DialogTitle>
            <DialogDescription>
              {preview.cost}. {preview.end}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void approve()} disabled={busy}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Withdraw this request?"
        description="The budget and timeline stay as they are."
        confirmLabel="Withdraw"
        onConfirm={() => void withdraw()}
      />
    </div>
  );
}

function ImpactBar({ label, width, className }: { label: string; width: number; className: string }) {
  const size = `${Math.min(100, Math.max(0, width))}%`;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="h-2 rounded-full bg-secondary">
        <div className={cn("h-2 rounded-full transition-[width] duration-500", className)} style={{ width: size }} />
      </div>
    </div>
  );
}
