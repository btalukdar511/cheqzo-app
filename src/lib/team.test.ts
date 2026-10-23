import { beforeEach, describe, expect, it } from "vitest";

import { api } from "@/data/api";
import { createSeedData, IDS } from "@/data/seed";
import { actorFromUser, changeMemberAccess, inviteMember, removeMember } from "@/lib/rules";
import { permissionSummary } from "@/lib/team";
import { useDb } from "@/store/db";
import type { User } from "@/types";

function user(id: string): User {
  const found = createSeedData().users.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("team", () => {
  const data = createSeedData();
  const hero = data.projects.find((item) => item.id === IDS.koramangala);
  if (!hero) throw new Error("missing project");

  it("derives the permission matrix from the rules", () => {
    const summary = permissionSummary();
    const invite = summary.find((row) => row.label === "Invite family");
    const approve = summary.find((row) => row.label === "Approve an update");
    expect(invite).toEqual({ label: "Invite family", owner: true, view: false, approve: false, designer: true });
    expect(approve).toMatchObject({ owner: true, view: false, approve: true, designer: false });
  });

  it("rejects a duplicate contact and refuses to remove the owner", () => {
    const duplicate = inviteMember({
      actor: actorFromUser(user(IDS.ananya)),
      project: hero,
      members: data.teamMembers,
      draft: { name: "Meera Again", contact: "98450 44404", role: "family", access: "view" },
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.reason).toBe("That contact is already on the project");

    const owner = data.teamMembers.find((member) => member.id === "tm_kora_ananya");
    if (!owner) throw new Error("missing owner");
    const removed = removeMember({ actor: actorFromUser(user(IDS.rohan)), member: owner });
    expect(removed.ok).toBe(false);
  });

  it("updates Meera's login when her project access changes", async () => {
    const meera = data.teamMembers.find((member) => member.id === "tm_kora_meera");
    if (!meera) throw new Error("missing meera");
    const changed = changeMemberAccess({
      actor: actorFromUser(user(IDS.ananya)),
      member: meera,
      users: data.users,
      access: "approve",
    });
    if (!changed.ok) throw new Error(changed.reason);
    expect(changed.value.member.access).toBe("approve");
    expect(changed.value.user?.id).toBe(IDS.meera);
    expect(changed.value.user?.access).toBe("approve");
  });
});

describe("team api", () => {
  beforeEach(() => {
    localStorage.clear();
    useDb.getState().setLatencyEnabled(false);
    useDb.getState().reset();
  });

  it("keeps an invite, then an acceptance, after the store updates", async () => {
    const invited = await api.inviteMember(IDS.rohan, IDS.koramangala, {
      name: "Neel Rao",
      contact: "neel@example.com",
      role: "family",
      access: "view",
    });
    expect(invited.status).toBe("invited");
    expect(useDb.getState().teamMembers.some((member) => member.id === invited.id)).toBe(true);
    const active = await api.acceptInvite(invited.id);
    expect(active.status).toBe("active");
    expect(useDb.getState().teamMembers.find((member) => member.id === invited.id)?.status).toBe("active");
  });
});
