"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { DisabledHint } from "@/components/shell/DisabledHint";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/data/api";
import { armInvite } from "@/lib/invite-clock";
import { can, type Actor } from "@/lib/rules";
import type { TeamMember } from "@/types";

export function MemberActions({ member, userId, actor }: { member: TeamMember; userId: string; actor: Actor }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const invite = can(actor, "invite_member");
  const locked = member.role === "owner" || member.role === "designer";
  const lockReason = member.role === "owner" ? "The owner can't be removed" : "The designer can't be removed";
  const accessReason = member.role === "owner" ? "Owner access can't be changed" : "Designer access can't be changed";

  async function setAccess(access: "view" | "approve") {
    try {
      await api.changeMemberAccess(userId, member.id, access);
      toast.success("Access updated");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not change access");
    }
  }

  async function resend() {
    try {
      const next = await api.resendInvite(userId, member.id);
      armInvite(next.id);
      toast.success("Invite sent");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not resend the invite");
    }
  }

  async function remove() {
    try {
      await api.removeMember(userId, member.id);
      toast.success("Member removed");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not remove the member");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <RoleGuard allowed={invite.allowed && !locked} reason={invite.allowed ? accessReason : invite.reason}>
            <AccessItem already={member.access === "view"} label="View only" reason="Already view only" onSelect={() => void setAccess("view")} />
          </RoleGuard>
          <RoleGuard allowed={invite.allowed && !locked} reason={invite.allowed ? accessReason : invite.reason}>
            <AccessItem already={member.access === "approve"} label="Can approve" reason="Already can approve" onSelect={() => void setAccess("approve")} />
          </RoleGuard>
          <RoleGuard allowed={invite.allowed && member.status === "invited"} reason={invite.allowed ? "They're already on the project" : invite.reason}>
            <DropdownMenuItem onSelect={() => void resend()}>Resend invite</DropdownMenuItem>
          </RoleGuard>
          <RoleGuard allowed={invite.allowed && !locked} reason={invite.allowed ? lockReason : invite.reason}>
            <DropdownMenuItem onSelect={() => setRemoveOpen(true)}>Remove</DropdownMenuItem>
          </RoleGuard>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove ${member.name}?`}
        description="They will lose access to this project."
        confirmLabel="Remove"
        onConfirm={() => void remove()}
      />
    </>
  );
}

function AccessItem({
  already,
  label,
  reason,
  onSelect,
  disabled = false,
}: {
  already: boolean;
  label: string;
  reason: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const item = (
    <DropdownMenuItem disabled={disabled || already} onSelect={onSelect}>
      {label}
    </DropdownMenuItem>
  );
  if (disabled || !already) return item;
  return (
    <DisabledHint disabled reason={reason}>
      {item}
    </DisabledHint>
  );
}
