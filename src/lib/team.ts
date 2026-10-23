import { can, type Actor } from "@/lib/rules";

export const TEAM_ROLE_LABEL = {
  owner: "Owner",
  family: "Family",
  designer: "Designer",
  site_supervisor: "Site supervisor",
} as const;

export const ACCESS_LABEL = {
  view: "View",
  approve: "Approve",
  full: "Full",
} as const;

export interface PermissionRow {
  label: string;
  owner: boolean;
  view: boolean;
  approve: boolean;
  designer: boolean;
}

const ACTORS = {
  owner: { id: "owner", role: "homeowner", access: "full" },
  view: { id: "view", role: "homeowner", access: "view" },
  approve: { id: "approve", role: "homeowner", access: "approve" },
  designer: { id: "designer", role: "designer", access: "full" },
} as const satisfies Record<string, Actor>;

export function permissionSummary(): PermissionRow[] {
  const rows: { label: string; check: (actor: Actor) => boolean }[] = [
    { label: "See project, rooms, financials", check: (actor) => can(actor, "see_project").allowed },
    { label: "Create a project", check: (actor) => can(actor, "create_project").allowed },
    { label: "Post a site update", check: (actor) => can(actor, "post_update").allowed },
    { label: "Approve an update", check: (actor) => can(actor, "decide_update").allowed },
    { label: "Record a payment", check: (actor) => can(actor, "record_payment").allowed },
    { label: "Acknowledge a payment", check: (actor) => can(actor, "decide_payment").allowed },
    { label: "Raise a change request", check: (actor) => can(actor, "raise_change_request").allowed },
    {
      label: "Decide a change request",
      check: (actor) =>
        can(actor, "decide_change_request", {
          raisedByRole: actor.role === "designer" ? "homeowner" : "designer",
          raisedById: "counterparty",
        }).allowed,
    },
    { label: "Edit room specs", check: (actor) => can(actor, "edit_room").allowed },
    { label: "Invite family", check: (actor) => can(actor, "invite_member").allowed },
  ];
  return rows.map((row) => ({
    label: row.label,
    owner: row.check(ACTORS.owner),
    view: row.check(ACTORS.view),
    approve: row.check(ACTORS.approve),
    designer: row.check(ACTORS.designer),
  }));
}
