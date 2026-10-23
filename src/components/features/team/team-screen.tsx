"use client";

import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";

import { PersonChip } from "@/components/features/financials/person-chip";
import { InviteDialog } from "@/components/features/team/invite-dialog";
import { MemberActions } from "@/components/features/team/member-actions";
import { PermissionCard } from "@/components/features/team/permission-card";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableSkeleton } from "@/components/shared/Skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLiveDb, useStoresReady } from "@/data/live";
import { relativeTime } from "@/lib/format";
import { actorFromUser, can } from "@/lib/rules";
import { ACCESS_LABEL, TEAM_ROLE_LABEL } from "@/lib/team";
import { cn } from "@/lib/utils";
import type { TeamMember, User } from "@/types";

function columns(users: User[], userId: string, actor: ReturnType<typeof actorFromUser>): LegacyColumnDef<TeamMember>[] {
  return [
    {
      id: "member",
      header: "Member",
      accessorFn: (member) => `${member.name} ${member.contact}`,
      cell: ({ row }) => {
        const match = users.find((user) => user.phone === row.original.contact || user.email === row.original.contact);
        return (
          <span className="block">
            {match ? <PersonChip user={match} /> : <span className="text-sm font-medium text-foreground">{row.original.name}</span>}
            <span className={cn("mt-0.5 block text-xs text-muted-foreground", match && "pl-8")}>{row.original.contact}</span>
          </span>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      accessorFn: (member) => TEAM_ROLE_LABEL[member.role],
    },
    {
      id: "access",
      header: "Access",
      accessorFn: (member) => ACCESS_LABEL[member.access],
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (member) => member.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "lastActive",
      header: "Last active",
      accessorFn: (member) => member.lastActiveAt ?? "",
      cell: ({ row }) => (row.original.lastActiveAt ? relativeTime(row.original.lastActiveAt) : "—"),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <MemberActions member={row.original} userId={userId} actor={actor} />,
    },
  ];
}

export function TeamScreen() {
  const route = useParams<{ projectId: string }>();
  const ready = useStoresReady();
  const user = useCurrentUser();
  const db = useLiveDb();
  const [inviteOpen, setInviteOpen] = useState(false);
  if (!ready || !user) return <TableSkeleton />;
  const project = db.projects.find((item) => item.id === route.projectId);
  if (!project) return null;
  const members = db.teamMembers.filter((member) => member.projectId === project.id);
  const actor = actorFromUser(user);
  const canInvite = can(actor, "invite_member").allowed;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">Team</h1>
        {canInvite ? (
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <Plus />
            Invite member
          </Button>
        ) : null}
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4">
        <DataTable
          data={members}
          columns={columns(db.users, user.id, actor)}
          searchPlaceholder="Search members"
          emptyTitle="No members yet"
          emptyDescription="Invite family or a site supervisor."
          hideIdlePagination
        />
        <PermissionCard />
      </div>
      {canInvite ? (
        <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} userId={user.id} projectId={project.id} />
      ) : null}
    </div>
  );
}
