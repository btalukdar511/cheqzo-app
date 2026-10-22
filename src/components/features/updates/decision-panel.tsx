"use client";

import { useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/data/api";
import { formatDate, relativeTime } from "@/lib/format";
import { personName } from "@/lib/project-view";
import type { Actor } from "@/lib/rules";
import { can } from "@/lib/rules";
import type { SiteUpdate, User } from "@/types";

export function DecisionPanel({
  update,
  roomName,
  users,
  userId,
  actor,
}: {
  update: SiteUpdate;
  roomName: string;
  users: User[];
  userId: string;
  actor: Actor;
}) {
  const permission = can(actor, "decide_update");
  const [asking, setAsking] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (update.status !== "pending") {
    if (!update.decision) return null;
    return (
      <section className="rounded-xl border border-border bg-secondary/50 p-4">
        <h3 className="text-sm font-semibold text-foreground">Decision</h3>
        <p className="mt-1 text-sm text-foreground">
          {update.status === "approved" ? "Approved" : update.status === "rejected" ? "Rejected" : "Changes requested"} by{" "}
          {personName(users, update.decision.byId)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(update.decision.at)} · {relativeTime(update.decision.at)}
        </p>
        {update.decision.comment ? <p className="mt-2 text-sm text-foreground">{update.decision.comment}</p> : null}
      </section>
    );
  }

  if (actor.role === "designer") {
    return <p className="text-sm text-muted-foreground">Waiting on the homeowner.</p>;
  }

  async function approve() {
    setPending(true);
    try {
      await api.approveUpdate(userId, update.id);
      toast.success(`${roomName} progress updated to ${update.proposedProgress}%`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not approve the update");
    } finally {
      setPending(false);
    }
  }

  async function requestChanges() {
    if (!comment.trim()) {
      setError("A comment is required");
      return;
    }
    setPending(true);
    try {
      await api.requestUpdateChanges(userId, update.id, comment);
      setAsking(false);
      setComment("");
      toast.success("Changes requested");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not request changes");
    } finally {
      setPending(false);
    }
  }

  async function reject(reason?: string) {
    if (!reason?.trim()) return;
    setPending(true);
    try {
      await api.rejectUpdate(userId, update.id, reason);
      toast.success("Update rejected");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not reject the update");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Decision</h3>
      <div className="flex flex-wrap gap-2">
        <RoleGuard allowed={permission.allowed} reason={permission.reason}>
          <Button onClick={approve} disabled={pending}>
            Approve
          </Button>
        </RoleGuard>
        <RoleGuard allowed={permission.allowed} reason={permission.reason}>
          <Button variant="outline" onClick={() => setAsking(true)} disabled={pending || asking}>
            Request changes
          </Button>
        </RoleGuard>
        <RoleGuard allowed={permission.allowed} reason={permission.reason}>
          <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={pending}>
            Reject
          </Button>
        </RoleGuard>
      </div>
      {asking ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor="change-comment">
            What should change?
          </label>
          <Textarea
            id="change-comment"
            value={comment}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              setComment(event.target.value);
              if (error) setError("");
            }}
            placeholder="Tell the designer what to revise"
          />
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <Button onClick={requestChanges} disabled={pending}>
              Send request
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAsking(false);
                setError("");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject this update"
        description="Progress stays where it is. The designer is notified with your reason."
        confirmLabel="Reject"
        requireReason
        reasonLabel="Reason"
        onConfirm={reject}
      />
    </section>
  );
}
