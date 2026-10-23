"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { api } from "@/data/api";
import { subscribeInvites } from "@/lib/invite-clock";
import { useDb } from "@/store/db";

export function InviteWatcher() {
  useEffect(() => {
    return subscribeInvites((memberId) => {
      const member = useDb.getState().teamMembers.find((item) => item.id === memberId);
      if (!member || member.status !== "invited") return;
      void api.acceptInvite(memberId).then(
        () => toast.success(`${member.name} joined the project`),
        () => undefined,
      );
    });
  }, []);
  return null;
}
