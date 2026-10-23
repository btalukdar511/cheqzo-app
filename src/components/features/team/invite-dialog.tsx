"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/data/api";
import { armInvite } from "@/lib/invite-clock";
import type { InviteDraft } from "@/lib/rules";

export function InviteDialog({
  open,
  onOpenChange,
  userId,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  projectId: string;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<InviteDraft["role"]>("family");
  const [access, setAccess] = useState<InviteDraft["access"]>("view");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const member = await api.inviteMember(userId, projectId, { name, contact, role, access });
      armInvite(member.id);
      toast.success("Invite sent");
      setName("");
      setContact("");
      onOpenChange(false);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not send the invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            View only can follow the project. Can approve lets a family member sign off updates, payments, and designer change requests.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">Phone or email</span>
            <Input value={contact} onChange={(event) => setContact(event.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Role</span>
              <Select value={role} onValueChange={(value) => setRole(value as InviteDraft["role"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="site_supervisor">Site supervisor</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Access</span>
              <Select value={access} onValueChange={(value) => setAccess(value as InviteDraft["access"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="approve">Can approve</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
